"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { supabase } from "@/lib/supabase";

type Driver = {
  id: string;
  full_name: string;
  driver_number: string | null;
  status: string | null;
};

type HOSEvent = {
  id: string;
  company_id: string | null;
  driver_id: string | null;
  event_type: string;
  event_time: string;
  location: string | null;
  source: string | null;
  created_at: string | null;
};

type ClockStatus = {
  label: string;
  remainingMinutes: number | null;
  limitMinutes: number;
  description: string;
  note: string;
};

const eventTypes = [
  "Off Duty",
  "Sleeper",
  "Driving",
  "On Duty",
];

const HOS_LIMITS = {
  drivingMinutes: 11 * 60,
  shiftMinutes: 14 * 60,
  cycleMinutes: 70 * 60,
  breakMinutes: 30,
};

export default function DriverPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] =
    useState<Driver | null>(null);

  const [events, setEvents] = useState<HOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("drivers")
      .select("id, full_name, driver_number, status")
      .order("full_name");

    if (error) {
      setMessage(`Could not load drivers: ${error.message}`);
      setLoading(false);
      return;
    }

    setDrivers(data || []);

    if (data && data.length > 0) {
      const defaultDriver =
        data.find((driver) =>
          driver.full_name?.toLowerCase().includes("john")
        ) || data[0];

      setSelectedDriver(defaultDriver);
      await loadEvents(defaultDriver.id);
    }

    setLoading(false);
  }

  async function loadEvents(driverId: string) {
    const { data, error } = await supabase
      .from("hos_events")
      .select(`
        id,
        company_id,
        driver_id,
        event_type,
        event_time,
        location,
        source,
        created_at
      `)
      .eq("driver_id", driverId)
      .order("event_time", {
        ascending: false,
      })
      .limit(500);

    if (error) {
      setMessage(`Could not load HOS events: ${error.message}`);
      return;
    }

    setEvents(data || []);
  }

  async function changeDriver(driverId: string) {
    const driver = drivers.find(
      (item) => item.id === driverId
    );

    if (!driver) return;

    setSelectedDriver(driver);
    setMessage("");

    await loadEvents(driver.id);
  }

  async function recordEvent(eventType: string) {
    if (!selectedDriver) {
      setMessage("Please select a driver.");
      return;
    }

    setSaving(true);
    setMessage("");

    const eventTime = new Date().toISOString();

    const { error } = await supabase
      .from("hos_events")
      .insert({
        driver_id: selectedDriver.id,
        event_type: eventType,
        event_time: eventTime,
        location: location.trim() || "Driver App",
        source: "Project Driver",
      });

    if (error) {
      setMessage(
        `Could not save HOS event: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setLocation("");

    setMessage(
      `${eventType} event recorded successfully.`
    );

    await loadEvents(selectedDriver.id);

    setSaving(false);
  }

  const currentStatus = useMemo(() => {
    if (events.length === 0) {
      return "Unknown";
    }

    return events[0].event_type;
  }, [events]);

  const lastEventTime = useMemo(() => {
    if (events.length === 0) {
      return null;
    }

    return events[0].event_time;
  }, [events]);

  const driverInitials = useMemo(() => {
    if (!selectedDriver?.full_name) {
      return "DR";
    }

    return selectedDriver.full_name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [selectedDriver]);

  const hosClocks = useMemo(() => {
    return calculateHOSClocks(events);
  }, [events]);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatMinutes(minutes: number | null) {
    if (minutes === null) {
      return "--";
    }

    const safeMinutes = Math.max(
      0,
      Math.floor(minutes)
    );

    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;

    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }

  function formatClockPercent(
    remaining: number | null,
    limit: number
  ) {
    if (remaining === null || remaining <= 0) {
      return 0;
    }

    return Math.min(100, (remaining / limit) * 100);
  }

  function statusIcon(status: string) {
    if (status === "Driving") return "🚚";
    if (status === "On Duty") return "🛠️";
    if (status === "Sleeper") return "🛏️";
    if (status === "Off Duty") return "🏠";

    return "❔";
  }

  function statusStyle(status: string): CSSProperties {
    if (status === "Driving") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    }

    if (status === "On Duty") {
      return {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fde68a",
      };
    }

    if (status === "Sleeper") {
      return {
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #ddd6fe",
      };
    }

    if (status === "Off Duty") {
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    }

    return {
      background: "#f1f5f9",
      color: "#475569",
      border: "1px solid #e2e8f0",
    };
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>🕐</div>

          <div style={styles.loadingTitle}>
            Project Driver
          </div>

          <div style={styles.loadingText}>
            Loading driver dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              PROJECT DRIVER
            </div>

            <h1 style={styles.title}>
              Driver Dashboard
            </h1>

            <p style={styles.subtitle}>
              Driver duty status, HOS clocks,
              event tracking and operational
              visibility.
            </p>
          </div>

          <div style={styles.driverSelector}>
            <label style={styles.label}>
              ACTIVE DRIVER
            </label>

            <select
              value={selectedDriver?.id || ""}
              onChange={(event) =>
                changeDriver(event.target.value)
              }
              style={styles.select}
            >
              {drivers.map((driver) => (
                <option
                  key={driver.id}
                  value={driver.id}
                >
                  {driver.full_name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {message && (
          <div style={styles.message}>
            <div style={styles.messageIcon}>✓</div>
            <div>{message}</div>
          </div>
        )}

        {!selectedDriver ? (
          <section style={styles.emptyDriver}>
            <div style={styles.emptyIcon}>👤</div>

            <h2 style={styles.emptyTitle}>
              No drivers available
            </h2>

            <p style={styles.emptyText}>
              Add a driver before recording HOS events.
            </p>
          </section>
        ) : (
          <>
            <section style={styles.driverHero}>
              <div style={styles.driverIdentity}>
                <div style={styles.avatar}>
                  {driverInitials}
                </div>

                <div>
                  <div style={styles.driverName}>
                    {selectedDriver.full_name}
                  </div>

                  <div style={styles.driverMeta}>
                    Driver #
                    {selectedDriver.driver_number || "N/A"}
                    {selectedDriver.status
                      ? ` • ${selectedDriver.status}`
                      : ""}
                  </div>
                </div>
              </div>

              <div style={styles.heroStatus}>
                <div style={styles.heroStatusLabel}>
                  CURRENT DUTY STATUS
                </div>

                <div
                  style={{
                    ...styles.statusBadge,
                    ...statusStyle(currentStatus),
                  }}
                >
                  <span>
                    {statusIcon(currentStatus)}
                  </span>

                  <span>{currentStatus}</span>
                </div>
              </div>
            </section>

            <section style={styles.kpiGrid}>
              <KpiCard
                label="Current Status"
                value={currentStatus}
                description="Latest recorded duty status"
              />

              <KpiCard
                label="HOS Events"
                value={String(events.length)}
                description="Events recorded for driver"
              />

              <KpiCard
                label="Last Event"
                value={
                  lastEventTime
                    ? formatDate(lastEventTime)
                    : "None"
                }
                description="Most recent status update"
              />

              <KpiCard
                label="Data Source"
                value="Project Driver"
                description="Current event source"
              />
            </section>

            <section style={styles.clockSection}>
              <div style={styles.clockHeader}>
                <div>
                  <div style={styles.clockTitle}>
                    HOS Clocks
                  </div>

                  <div style={styles.clockSubtitle}>
                    Operational time remaining based
                    on recorded duty-status events.
                  </div>
                </div>

                <div style={styles.operationalBadge}>
                  OPERATIONAL VIEW
                </div>
              </div>

              <div style={styles.clockGrid}>
                <ClockCard
                  label="Drive"
                  remainingMinutes={
                    hosClocks.drive.remainingMinutes
                  }
                  limitMinutes={
                    hosClocks.drive.limitMinutes
                  }
                  description={
                    hosClocks.drive.description
                  }
                  note={hosClocks.drive.note}
                  formatMinutes={formatMinutes}
                  formatClockPercent={
                    formatClockPercent
                  }
                />

                <ClockCard
                  label="Shift"
                  remainingMinutes={
                    hosClocks.shift.remainingMinutes
                  }
                  limitMinutes={
                    hosClocks.shift.limitMinutes
                  }
                  description={
                    hosClocks.shift.description
                  }
                  note={hosClocks.shift.note}
                  formatMinutes={formatMinutes}
                  formatClockPercent={
                    formatClockPercent
                  }
                />

                <ClockCard
                  label="Cycle"
                  remainingMinutes={
                    hosClocks.cycle.remainingMinutes
                  }
                  limitMinutes={
                    hosClocks.cycle.limitMinutes
                  }
                  description={
                    hosClocks.cycle.description
                  }
                  note={hosClocks.cycle.note}
                  formatMinutes={formatMinutes}
                  formatClockPercent={
                    formatClockPercent
                  }
                />

                <ClockCard
                  label="Break"
                  remainingMinutes={
                    hosClocks.break.remainingMinutes
                  }
                  limitMinutes={
                    hosClocks.break.limitMinutes
                  }
                  description={
                    hosClocks.break.description
                  }
                  note={hosClocks.break.note}
                  formatMinutes={formatMinutes}
                  formatClockPercent={
                    formatClockPercent
                  }
                />
              </div>

              <div style={styles.clockDisclaimer}>
                These clocks are an operational
                calculation from Project Driver
                HOS events. They are not an official
                ELD record until an authorized ELD
                integration is connected.
              </div>
            </section>

            <section style={styles.warning}>
              <div style={styles.warningIcon}>
                ⚠️
              </div>

              <div>
                <div style={styles.warningTitle}>
                  ELD integration pending
                </div>

                <div style={styles.warningText}>
                  Current HOS events and clocks are
                  displayed from Project Driver.
                  Official HOS calculations and
                  compliance status will be connected
                  to an authorized ELD provider.
                </div>
              </div>

              <div style={styles.pendingBadge}>
                PENDING
              </div>
            </section>

            <section style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <div style={styles.panelTitle}>
                    Duty Status
                  </div>

                  <div style={styles.panelSubtitle}>
                    Record the driver's current
                    duty status.
                  </div>
                </div>

                <div style={styles.lastEvent}>
                  {lastEventTime
                    ? `Last event: ${formatDate(
                        lastEventTime
                      )}`
                    : "No events recorded"}
                </div>
              </div>

              <div style={styles.statusGrid}>
                {eventTypes.map((type) => {
                  const active =
                    currentStatus === type;

                  return (
                    <button
  type="button"
  key={type}
  onClick={() => {
    setMessage(`HOS button clicked: ${type}`);
    void recordEvent(type);
  }}
  disabled={saving || !selectedDriver}
  style={{
  ...styles.statusButton,
  ...(active ? styles.activeStatusButton : {}),
}}
>
                      <span
                        style={
                          styles.statusButtonIcon
                        }
                      >
                        {statusIcon(type)}
                      </span>

                      <span
                        style={
                          styles.statusButtonText
                        }
                      >
                        {type}
                      </span>

                      {active && (
                        <span
                          style={
                            styles.currentPill
                          }
                        >
                          CURRENT
                        </span>
                      )}

                      {saving && active && (
                        <span
                          style={styles.savingText}
                        >
                          Saving...
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={styles.locationSection}>
                <div>
                  <label style={styles.label}>
                    LOCATION / NOTE
                  </label>

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                    placeholder="Example: Miami, FL"
                    style={styles.input}
                  />
                </div>

                <div style={styles.locationHint}>
                  This field can later be populated
                  automatically by authorized GPS
                  data.
                </div>
              </div>
            </section>

            <section style={styles.historyPanel}>
              <div style={styles.panelHeader}>
                <div>
                  <div style={styles.panelTitle}>
                    HOS Event History
                  </div>

                  <div style={styles.panelSubtitle}>
                    Latest duty-status events for
                    this driver.
                  </div>
                </div>

                <div style={styles.countBadge}>
                  {events.length} events
                </div>
              </div>

              {events.length === 0 ? (
                <div style={styles.emptyHistory}>
                  <div
                    style={
                      styles.emptyHistoryIcon
                    }
                  >
                    🕐
                  </div>

                  <div style={styles.emptyTitle}>
                    No HOS events yet
                  </div>

                  <div style={styles.emptyText}>
                    Select a duty status above to
                    create the first event.
                  </div>
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>
                          STATUS
                        </th>

                        <th style={styles.th}>
                          DATE / TIME
                        </th>

                        <th style={styles.th}>
                          LOCATION
                        </th>

                        <th style={styles.th}>
                          SOURCE
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.tableStatus,
                                ...statusStyle(
                                  event.event_type
                                ),
                              }}
                            >
                              <span>
                                {statusIcon(
                                  event.event_type
                                )}
                              </span>

                              <span>
                                {event.event_type}
                              </span>
                            </span>
                          </td>

                          <td style={styles.td}>
                            <div
                              style={
                                styles.primaryCell
                              }
                            >
                              {formatDate(
                                event.event_time
                              )}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div
                              style={
                                styles.secondaryCell
                              }
                            >
                              {event.location ||
                                "Not provided"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={
                                styles.sourceBadge
                              }
                            >
                              {event.source ||
                                "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section style={styles.futureGrid}>
              <FutureCard
                icon="📊"
                title="HOS Clocks"
                description="Operational 11-hour driving, 14-hour shift, 70-hour cycle and break clocks are displayed from Project Driver events."
                tag="OPERATIONAL"
              />

              <FutureCard
                icon="📍"
                title="GPS Tracking"
                description="Driver location can later be correlated with duty-status events when the authorized GPS integration is connected."
                tag="GPS INTEGRATION"
              />

              <FutureCard
                icon="🚚"
                title="ELD Integration"
                description="Authorized ELD data will provide official electronic logging information when the integration is connected."
                tag="PENDING"
              />
            </section>

            <section style={styles.principle}>
              <div style={styles.principleIcon}>
                AI
              </div>

              <div>
                <div style={styles.principleTitle}>
                  Project Logistics Driver
                </div>

                <div style={styles.principleText}>
                  Operational driver information
                  is displayed here. Compliance
                  decisions remain outside this
                  Driver App screen.
                </div>
              </div>

              <div style={styles.principleBadge}>
                DRIVER APP
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function calculateHOSClocks(
  events: HOSEvent[]
): {
  drive: ClockStatus;
  shift: ClockStatus;
  cycle: ClockStatus;
  break: ClockStatus;
} {
  if (events.length === 0) {
    return {
      drive: {
        label: "Drive",
        remainingMinutes: null,
        limitMinutes: HOS_LIMITS.drivingMinutes,
        description: "11-hour driving window",
        note: "No HOS events available.",
      },

      shift: {
        label: "Shift",
        remainingMinutes: null,
        limitMinutes: HOS_LIMITS.shiftMinutes,
        description: "14-hour duty window",
        note: "No HOS events available.",
      },

      cycle: {
        label: "Cycle",
        remainingMinutes: null,
        limitMinutes: HOS_LIMITS.cycleMinutes,
        description: "70-hour cycle window",
        note: "More history is required.",
      },

      break: {
        label: "Break",
        remainingMinutes: null,
        limitMinutes: HOS_LIMITS.breakMinutes,
        description: "30-minute break requirement",
        note: "More HOS history is required.",
      },
    };
  }

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.event_time).getTime() -
      new Date(b.event_time).getTime()
  );

  const now = Date.now();

  const latestEvent =
    sorted[sorted.length - 1];

  const latestStatus =
    latestEvent.event_type;

  const latestResetIndex =
    findLatestResetIndex(sorted);

  const shiftStartIndex =
    latestResetIndex >= 0
      ? latestResetIndex
      : findShiftStartIndex(sorted);

  const shiftEvents = sorted.slice(
    Math.max(0, shiftStartIndex)
  );

  const drivingMinutes =
    calculateDrivingMinutes(
      shiftEvents,
      now
    );

  const shiftStartTime =
    getShiftStartTime(shiftEvents);

  const shiftElapsedMinutes =
    shiftStartTime === null
      ? null
      : Math.max(
          0,
          (now - shiftStartTime) / 60000
        );

  const cycleMinutes =
    calculateCycleMinutes(
      sorted,
      now
    );

  const breakRemaining =
    calculateBreakRemaining(
      sorted,
      now
    );

  const driveRemaining =
    shiftStartTime === null
      ? null
      : Math.max(
          0,
          HOS_LIMITS.drivingMinutes -
            drivingMinutes
        );

  const shiftRemaining =
    shiftElapsedMinutes === null
      ? null
      : Math.max(
          0,
          HOS_LIMITS.shiftMinutes -
            shiftElapsedMinutes
        );

  const cycleRemaining =
    cycleMinutes === null
      ? null
      : Math.max(
          0,
          HOS_LIMITS.cycleMinutes -
            cycleMinutes
        );

  let driveNote =
    "Calculated from recorded Driving events.";

  let shiftNote =
    "Calculated from the current operational shift.";

  let cycleNote =
    "Calculated from available event history.";

  const breakNote =
    "Based on recorded non-driving activity.";

  if (
    latestStatus === "Off Duty" ||
    latestStatus === "Sleeper"
  ) {
    driveNote =
      "Driving clock is not consumed while off duty or in sleeper.";
  }

  if (
    shiftRemaining !== null &&
    shiftRemaining <= 0
  ) {
    shiftNote =
      "14-hour shift window exhausted.";
  }

  if (
    driveRemaining !== null &&
    driveRemaining <= 0
  ) {
    driveNote =
      "11-hour driving limit reached.";
  }

  if (
    cycleRemaining !== null &&
    cycleRemaining <= 0
  ) {
    cycleNote =
      "70-hour cycle limit reached.";
  }

  return {
    drive: {
      label: "Drive",
      remainingMinutes: driveRemaining,
      limitMinutes: HOS_LIMITS.drivingMinutes,
      description: "11-hour driving window",
      note: driveNote,
    },

    shift: {
      label: "Shift",
      remainingMinutes: shiftRemaining,
      limitMinutes: HOS_LIMITS.shiftMinutes,
      description: "14-hour duty window",
      note: shiftNote,
    },

    cycle: {
      label: "Cycle",
      remainingMinutes: cycleRemaining,
      limitMinutes: HOS_LIMITS.cycleMinutes,
      description: "70-hour cycle window",
      note: cycleNote,
    },

    break: {
      label: "Break",
      remainingMinutes: breakRemaining,
      limitMinutes: HOS_LIMITS.breakMinutes,
      description: "30-minute break requirement",
      note: breakNote,
    },
  };
}

function findLatestResetIndex(
  events: HOSEvent[]
) {
  for (
    let i = events.length - 1;
    i >= 0;
    i--
  ) {
    if (
      events[i].event_type === "Off Duty" ||
      events[i].event_type === "Sleeper"
    ) {
      const nextIndex = i + 1;

      if (nextIndex >= events.length) {
        return i;
      }

      const resetEnd =
        new Date(
          events[i].event_time
        ).getTime();

      const nextTime =
        new Date(
          events[nextIndex].event_time
        ).getTime();

      const offDutyHours =
        (nextTime - resetEnd) /
        3600000;

      if (offDutyHours >= 10) {
        return nextIndex;
      }
    }
  }

  return -1;
}

function findShiftStartIndex(
  events: HOSEvent[]
) {
  const now = Date.now();

  for (
    let i = events.length - 1;
    i >= 0;
    i--
  ) {
    const eventTime =
      new Date(
        events[i].event_time
      ).getTime();

    const hoursAgo =
      (now - eventTime) /
      3600000;

    if (hoursAgo > 14) {
      return Math.min(
        i + 1,
        events.length - 1
      );
    }
  }

  return 0;
}

function getShiftStartTime(
  events: HOSEvent[]
) {
  if (events.length === 0) {
    return null;
  }

  return new Date(
    events[0].event_time
  ).getTime();
}

function calculateDrivingMinutes(
  events: HOSEvent[],
  now: number
) {
  let total = 0;

  for (
    let i = 0;
    i < events.length;
    i++
  ) {
    if (
      events[i].event_type !== "Driving"
    ) {
      continue;
    }

    const start =
      new Date(
        events[i].event_time
      ).getTime();

    const end =
      i < events.length - 1
        ? new Date(
            events[i + 1].event_time
          ).getTime()
        : now;

    if (end > start) {
      total +=
        (end - start) / 60000;
    }
  }

  return total;
}

function calculateCycleMinutes(
  events: HOSEvent[],
  now: number
) {
  const cutoff =
    now -
    8 * 24 * 60 * 60 * 1000;

  const cycleEvents =
    events.filter(
      (event) =>
        new Date(
          event.event_time
        ).getTime() >= cutoff
    );

  if (cycleEvents.length === 0) {
    return null;
  }

  let total = 0;

  for (
    let i = 0;
    i < cycleEvents.length;
    i++
  ) {
    const start =
      new Date(
        cycleEvents[i].event_time
      ).getTime();

    const end =
      i < cycleEvents.length - 1
        ? new Date(
            cycleEvents[i + 1].event_time
          ).getTime()
        : now;

    if (
      cycleEvents[i].event_type !==
        "Off Duty" &&
      cycleEvents[i].event_type !==
        "Sleeper" &&
      end > start
    ) {
      total +=
        (end - start) / 60000;
    }
  }

  return total;
}

function calculateBreakRemaining(
  events: HOSEvent[],
  now: number
) {
  if (events.length === 0) {
    return null;
  }

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.event_time).getTime() -
      new Date(b.event_time).getTime()
  );

  for (
    let i = sorted.length - 1;
    i >= 0;
    i--
  ) {
    const event = sorted[i];

    if (
      event.event_type === "Off Duty" ||
      event.event_type === "Sleeper"
    ) {
      const lastBreakStart =
        new Date(
          event.event_time
        ).getTime();

      const nextEvent =
        sorted[i + 1];

      if (!nextEvent) {
        const elapsed =
          (now - lastBreakStart) /
          60000;

        if (
          elapsed >=
          HOS_LIMITS.breakMinutes
        ) {
          return 0;
        }

        return Math.max(
          0,
          HOS_LIMITS.breakMinutes -
            elapsed
        );
      }

      const nextTime =
        new Date(
          nextEvent.event_time
        ).getTime();

      const breakMinutes =
        (nextTime -
          lastBreakStart) /
        60000;

      if (
        breakMinutes >=
        HOS_LIMITS.breakMinutes
      ) {
        return 0;
      }

      return Math.max(
        0,
        HOS_LIMITS.breakMinutes -
          breakMinutes
      );
    }
  }

  return HOS_LIMITS.breakMinutes;
}

function KpiCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>
        {label}
      </div>

      <div style={styles.kpiValue}>
        {value}
      </div>

      <div style={styles.kpiDescription}>
        {description}
      </div>
    </div>
  );
}

function ClockCard({
  label,
  remainingMinutes,
  limitMinutes,
  description,
  note,
  formatMinutes,
  formatClockPercent,
}: {
  label: string;
  remainingMinutes: number | null;
  limitMinutes: number;
  description: string;
  note: string;
  formatMinutes: (
    minutes: number | null
  ) => string;
  formatClockPercent: (
    remaining: number | null,
    limit: number
  ) => number;
}) {
  const percent =
    formatClockPercent(
      remainingMinutes,
      limitMinutes
    );

  const exhausted =
    remainingMinutes !== null &&
    remainingMinutes <= 0;

  return (
    <div style={styles.clockCard}>
      <div style={styles.clockTop}>
        <div>
          <div style={styles.clockLabel}>
            {label}
          </div>

          <div style={styles.clockDescription}>
            {description}
          </div>
        </div>

        <div
          style={{
            ...styles.clockState,
            ...(exhausted
              ? styles.clockStateDanger
              : {}),
          }}
        >
          {remainingMinutes === null
            ? "DATA NEEDED"
            : exhausted
            ? "LIMIT"
            : "AVAILABLE"}
        </div>
      </div>

      <div style={styles.clockValue}>
        {formatMinutes(remainingMinutes)}
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressBar,
            width: `${percent}%`,
          }}
        />
      </div>

      <div style={styles.clockNote}>
        {note}
      </div>
    </div>
  );
}

function FutureCard({
  icon,
  title,
  description,
  tag,
}: {
  icon: string;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div style={styles.futureCard}>
      <div style={styles.futureIcon}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={styles.futureTitle}>
          {title}
        </div>

        <div style={styles.futureDescription}>
          {description}
        </div>

        <div style={styles.futureTag}>
          {tag}
        </div>
      </div>
    </div>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "32px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "24px",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: 850,
    color: "#64748b",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.1,
    fontWeight: 850,
    letterSpacing: "-0.03em",
  },

  subtitle: {
    margin: "9px 0 0",
    maxWidth: "720px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  driverSelector: {
    width: "270px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 850,
    letterSpacing: "0.06em",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: 650,
    outline: "none",
  },

  loadingCard: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  loadingIcon: {
    fontSize: "42px",
    marginBottom: "14px",
  },

  loadingTitle: {
    fontSize: "20px",
    fontWeight: 850,
  },

  loadingText: {
    marginTop: "7px",
    color: "#64748b",
    fontSize: "13px",
  },

  message: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    padding: "12px 15px",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#1e40af",
    fontSize: "12px",
    fontWeight: 700,
  },

  messageIcon: {
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#dbeafe",
    fontSize: "11px",
    fontWeight: 900,
  },

  driverHero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "16px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.04)",
  },

  driverIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  avatar: {
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 850,
  },

  driverName: {
    fontSize: "19px",
    fontWeight: 850,
    letterSpacing: "-0.02em",
  },

  driverMeta: {
    marginTop: "5px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 550,
  },

  heroStatus: {
    textAlign: "right",
  },

  heroStatusLabel: {
    marginBottom: "7px",
    color: "#94a3b8",
    fontSize: "9px",
    fontWeight: 850,
    letterSpacing: "0.07em",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  kpiCard: {
    minWidth: 0,
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.04)",
  },

  kpiLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 850,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  kpiValue: {
    marginTop: "9px",
    color: "#0f172a",
    fontSize: "21px",
    lineHeight: 1.2,
    fontWeight: 850,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  kpiDescription: {
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  clockSection: {
    marginBottom: "18px",
    border: "1px solid #dbe3ee",
    borderRadius: "16px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow:
      "0 5px 20px rgba(15, 23, 42, 0.05)",
  },

  clockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    padding: "20px 22px",
    borderBottom: "1px solid #e2e8f0",
  },

  clockTitle: {
    fontSize: "17px",
    fontWeight: 850,
    letterSpacing: "-0.01em",
  },

  clockSubtitle: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "11px",
  },

  operationalBadge: {
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "9px",
    fontWeight: 850,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },

  clockGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    padding: "18px 22px",
  },

  clockCard: {
    minWidth: 0,
    padding: "17px",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    background: "#f8fafc",
  },

  clockTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },

  clockLabel: {
    fontSize: "13px",
    fontWeight: 850,
  },

  clockDescription: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "9px",
    lineHeight: 1.4,
  },

  clockState: {
    padding: "4px 6px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "7px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  clockStateDanger: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  clockValue: {
    marginTop: "18px",
    fontSize: "25px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  progressTrack: {
    height: "7px",
    marginTop: "15px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#e2e8f0",
  },

  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "#2563eb",
    transition: "width .25s ease",
  },

  clockNote: {
    minHeight: "31px",
    marginTop: "10px",
    color: "#64748b",
    fontSize: "9px",
    lineHeight: 1.45,
  },

  clockDisclaimer: {
    padding: "12px 22px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  warning: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "18px",
    padding: "15px 18px",
    border: "1px solid #fed7aa",
    borderRadius: "12px",
    background: "#fff7ed",
    color: "#9a3412",
  },

  warningIcon: {
    fontSize: "20px",
  },

  warningTitle: {
    fontSize: "12px",
    fontWeight: 850,
  },

  warningText: {
    marginTop: "4px",
    maxWidth: "900px",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  pendingBadge: {
    marginLeft: "auto",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#ffedd5",
    color: "#9a3412",
    fontSize: "9px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  panel: {
    marginBottom: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.04)",
  },

  historyPanel: {
    marginBottom: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.04)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "18px",
    padding: "20px 22px",
    borderBottom: "1px solid #e2e8f0",
  },

  panelTitle: {
    fontSize: "16px",
    fontWeight: 850,
    letterSpacing: "-0.01em",
  },

  panelSubtitle: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "11px",
  },

  lastEvent: {
    color: "#64748b",
    fontSize: "10px",
    whiteSpace: "nowrap",
  },

  statusGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    padding: "20px 22px",
  },

  statusButton: {
    position: "relative",
    minHeight: "125px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 800,
    transition:
      "border-color .15s ease, background .15s ease",
  },

  activeStatusButton: {
    border: "2px solid #2563eb",
    background: "#eff6ff",
  },

  statusButtonIcon: {
    fontSize: "28px",
  },

  statusButtonText: {
    fontSize: "12px",
    fontWeight: 850,
  },

  currentPill: {
    padding: "4px 7px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.05em",
  },

  savingText: {
    position: "absolute",
    right: "8px",
    top: "8px",
    color: "#64748b",
    fontSize: "8px",
    fontWeight: 750,
  },

  locationSection: {
    margin: "0 22px",
    padding: "18px 0 20px",
    borderTop: "1px solid #f1f5f9",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "12px",
    outline: "none",
  },

  locationHint: {
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "9px",
  },

  countBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "9px",
    fontWeight: 850,
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "720px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: 850,
    letterSpacing: "0.06em",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "11px",
    color: "#334155",
    whiteSpace: "nowrap",
  },

  tableStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 8px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 850,
  },

  primaryCell: {
    color: "#334155",
    fontWeight: 650,
  },

  secondaryCell: {
    color: "#64748b",
    fontWeight: 550,
  },

  sourceBadge: {
    display: "inline-flex",
    padding: "5px 8px",
    borderRadius: "7px",
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: 700,
  },

  emptyDriver: {
    padding: "70px 24px",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    textAlign: "center",
  },

  emptyHistory: {
    padding: "55px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  emptyHistoryIcon: {
    fontSize: "36px",
    marginBottom: "10px",
  },

  emptyTitle: {
    fontSize: "16px",
    fontWeight: 850,
    color: "#0f172a",
  },

  emptyText: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  futureGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  futureCard: {
    display: "flex",
    gap: "13px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.04)",
  },

  futureIcon: {
    fontSize: "25px",
  },

  futureTitle: {
    fontSize: "13px",
    fontWeight: 850,
    color: "#0f172a",
  },

  futureDescription: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  futureTag: {
    display: "inline-flex",
    marginTop: "10px",
    padding: "4px 7px",
    borderRadius: "6px",
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: "8px",
    fontWeight: 850,
    letterSpacing: "0.05em",
  },

  principle: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "16px 18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#0f172a",
    color: "#ffffff",
  },

  principleIcon: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#1e293b",
    color: "#93c5fd",
    fontSize: "10px",
    fontWeight: 900,
  },

  principleTitle: {
    fontSize: "11px",
    fontWeight: 850,
  },

  principleText: {
    marginTop: "3px",
    color: "#94a3b8",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  principleBadge: {
    marginLeft: "auto",
    padding: "7px 9px",
    border: "1px solid #334155",
    borderRadius: "7px",
    color: "#cbd5e1",
    fontSize: "8px",
    fontWeight: 850,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },
};