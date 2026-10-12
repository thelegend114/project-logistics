"use client";

import { useMemo, useState } from "react";

type Broker = {
  id: string;
  name: string;
  connection: "Connected" | "Pending" | "Disconnected";
  status: "Active" | "Review";
  loads: number;
  lastSync: string;
};

type Integration = {
  name: string;
  type: string;
  status: "Connected" | "Pending" | "Planned";
  description: string;
};

const brokers: Broker[] = [
  {
    id: "BRK-001",
    name: "Sample Broker Network",
    connection: "Connected",
    status: "Active",
    loads: 24,
    lastSync: "Today, 9:42 AM",
  },
  {
    id: "BRK-002",
    name: "National Freight Partners",
    connection: "Connected",
    status: "Active",
    loads: 18,
    lastSync: "Today, 9:31 AM",
  },
  {
    id: "BRK-003",
    name: "Regional Logistics Group",
    connection: "Pending",
    status: "Review",
    loads: 7,
    lastSync: "Yesterday, 4:18 PM",
  },
];

const integrations: Integration[] = [
  {
    name: "Broker APIs",
    type: "API",
    status: "Connected",
    description:
      "Authorized broker integrations for load availability, status and operational data.",
  },
  {
    name: "Load Feeds",
    type: "Feed",
    status: "Connected",
    description:
      "Structured load feeds can be imported into Project Logistics for dispatch review.",
  },
  {
    name: "Email Intake",
    type: "Workflow",
    status: "Connected",
    description:
      "Incoming rate confirmations and load information can be routed into operations.",
  },
  {
    name: "External Portals",
    type: "Portal",
    status: "Planned",
    description:
      "Authorized portal workflows can be centralized through the Broker Hub.",
  },
];

export default function BrokerHubPage() {
  const [search, setSearch] = useState("");
  const [connectionFilter, setConnectionFilter] =
    useState<"All" | Broker["connection"]>("All");
  const [selectedBroker, setSelectedBroker] =
    useState<Broker | null>(null);

  const filteredBrokers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brokers.filter((broker) => {
      const matchesSearch =
        !query ||
        broker.name.toLowerCase().includes(query) ||
        broker.id.toLowerCase().includes(query);

      const matchesConnection =
        connectionFilter === "All" ||
        broker.connection === connectionFilter;

      return matchesSearch && matchesConnection;
    });
  }, [search, connectionFilter]);

  const stats = useMemo(() => {
    const connected = brokers.filter(
      (broker) => broker.connection === "Connected"
    ).length;

    const pending = brokers.filter(
      (broker) => broker.connection === "Pending"
    ).length;

    const loads = brokers.reduce(
      (total, broker) => total + broker.loads,
      0
    );

    return {
      total: brokers.length,
      connected,
      pending,
      loads,
    };
  }, []);

  function connectionStyle(
    connection: Broker["connection"]
  ) {
    if (connection === "Connected") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (connection === "Pending") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  function integrationStyle(
    status: Integration["status"]
  ) {
    if (status === "Connected") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "Pending") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#e2e8f0",
      color: "#475569",
    };
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#64748b",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Project Broker Hub
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-0.035em",
              }}
            >
              Broker Hub
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                fontSize: "13px",
                color: "#64748b",
                lineHeight: 1.65,
                maxWidth: "760px",
              }}
            >
              Centralize broker relationships, load feeds,
              authorized integrations and operational workflows
              in one workspace.
            </p>
          </div>

          <button
            onClick={() =>
              alert(
                "Broker connection workflow will be available here."
              )
            }
            style={{
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              borderRadius: "9px",
              padding: "11px 16px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow:
                "0 5px 14px rgba(15,23,42,.12)",
            }}
          >
            + Connect Broker
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <StatCard
            label="Total Brokers"
            value={String(stats.total)}
            description="Broker relationships"
          />

          <StatCard
            label="Connected"
            value={String(stats.connected)}
            description="Active connections"
            valueColor="#166534"
          />

          <StatCard
            label="Pending"
            value={String(stats.pending)}
            description="Connections requiring review"
            valueColor={
              stats.pending > 0
                ? "#92400e"
                : "#166534"
            }
          />

          <StatCard
            label="Available Loads"
            value={String(stats.loads)}
            description="Loads across broker sources"
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.55fr) minmax(300px, .75fr)",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              borderRadius: "16px",
              padding: "24px",
              color: "#ffffff",
              boxShadow:
                "0 14px 35px rgba(15,23,42,.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Broker Intelligence
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  One command center for broker operations
                </div>

                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: "700px",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    lineHeight: 1.75,
                  }}
                >
                  Authorized broker data can enter the same
                  operational environment used by dispatch.
                  Project Logistics can analyze opportunities,
                  compare loads and prepare recommendations
                  while keeping final decisions under human
                  control.
                </p>
              </div>

              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: "999px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "9px",
                  fontWeight: 850,
                  whiteSpace: "nowrap",
                }}
              >
                SYSTEM READY
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "22px",
              }}
            >
              <CommandStep
                number="01"
                title="Receive"
                text="Authorized broker data enters the platform."
              />

              <CommandStep
                number="02"
                title="Analyze"
                text="AI evaluates operational and financial fit."
              />

              <CommandStep
                number="03"
                title="Decide"
                text="Human reviews and approves the action."
              />
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "22px",
              boxShadow:
                "0 4px 18px rgba(15,23,42,.04)",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              Integration Policy
            </div>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: "11px",
                lineHeight: 1.75,
              }}
            >
              Broker connections should use authorized APIs,
              feeds, approved workflows or other permitted
              integration methods.
            </p>

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Human Control
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  fontWeight: 750,
                  color: "#0f172a",
                }}
              >
                AI recommends. Human decides.
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow:
              "0 4px 18px rgba(15,23,42,.04)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom:
                "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                }}
              >
                Broker Connections
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "11px",
                  color: "#64748b",
                }}
              >
                Monitor broker connectivity and load activity.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "5px",
                padding: "4px",
                background: "#f1f5f9",
                borderRadius: "10px",
              }}
            >
              {(
                [
                  "All",
                  "Connected",
                  "Pending",
                  "Disconnected",
                ] as const
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() =>
                    setConnectionFilter(filter)
                  }
                  style={{
                    border: "none",
                    borderRadius: "7px",
                    padding: "8px 11px",
                    background:
                      connectionFilter === filter
                        ? "#ffffff"
                        : "transparent",
                    boxShadow:
                      connectionFilter === filter
                        ? "0 1px 4px rgba(15,23,42,.08)"
                        : "none",
                    color:
                      connectionFilter === filter
                        ? "#0f172a"
                        : "#64748b",
                    fontSize: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "15px 22px",
              borderBottom:
                "1px solid #e2e8f0",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                position: "relative",
              }}
            >
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search broker or broker ID..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "9px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#0f172a",
                  outline: "none",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "900px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                  }}
                >
                  <Th>Broker</Th>
                  <Th>Connection</Th>
                  <Th>Status</Th>
                  <Th>Loads</Th>
                  <Th>Last Sync</Th>
                  <Th />
                </tr>
              </thead>

              <tbody>
                {filteredBrokers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "50px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      No brokers found.
                    </td>
                  </tr>
                ) : (
                  filteredBrokers.map((broker) => (
                    <tr
                      key={broker.id}
                      style={{
                        transition:
                          "background .15s ease",
                      }}
                    >
                      <Td strong>
                        <div>{broker.name}</div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "10px",
                            color: "#94a3b8",
                            fontWeight: 600,
                          }}
                        >
                          {broker.id}
                        </div>
                      </Td>

                      <Td>
                        <StatusBadge
                          label={broker.connection}
                          style={connectionStyle(
                            broker.connection
                          )}
                        />
                      </Td>

                      <Td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 750,
                            color:
                              broker.status ===
                              "Active"
                                ? "#166534"
                                : "#92400e",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background:
                                broker.status ===
                                "Active"
                                  ? "#22c55e"
                                  : "#f59e0b",
                            }}
                          />
                          {broker.status}
                        </span>
                      </Td>

                      <Td strong>
                        {broker.loads}
                      </Td>

                      <Td muted>
                        {broker.lastSync}
                      </Td>

                      <Td align="right">
                        <button
                          onClick={() =>
                            setSelectedBroker(
                              broker
                            )
                          }
                          style={{
                            border:
                              "1px solid #cbd5e1",
                            background:
                              "#ffffff",
                            color:
                              "#0f172a",
                            borderRadius:
                              "7px",
                            padding:
                              "7px 11px",
                            fontSize:
                              "10px",
                            fontWeight: 800,
                            cursor:
                              "pointer",
                          }}
                        >
                          View
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow:
              "0 4px 18px rgba(15,23,42,.04)",
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              Integration Center
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              Operational connection points for the broker ecosystem.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "1px",
              background: "#e2e8f0",
            }}
          >
            {integrations.map((integration) => (
              <div
                key={integration.name}
                style={{
                  background: "#ffffff",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                      }}
                    >
                      {integration.name}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "10px",
                        color: "#94a3b8",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {integration.type}
                    </div>
                  </div>

                  <StatusBadge
                    label={integration.status}
                    style={integrationStyle(
                      integration.status
                    )}
                  />
                </div>

                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: "11px",
                    color: "#64748b",
                    lineHeight: 1.65,
                  }}
                >
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedBroker && (
        <div
          onClick={() =>
            setSelectedBroker(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15,23,42,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 100,
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "620px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 70px rgba(15,23,42,.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 22px",
                borderBottom:
                  "1px solid #e2e8f0",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 800,
                  }}
                >
                  Broker Details
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    color: "#94a3b8",
                    fontWeight: 650,
                  }}
                >
                  {selectedBroker.id}
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedBroker(null)
                }
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  color: "#475569",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "22px",
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "18px",
              }}
            >
              <Detail
                label="Broker"
                value={selectedBroker.name}
              />

              <Detail
                label="Connection"
                value={selectedBroker.connection}
              />

              <Detail
                label="Status"
                value={selectedBroker.status}
              />

              <Detail
                label="Available Loads"
                value={String(
                  selectedBroker.loads
                )}
              />

              <Detail
                label="Last Sync"
                value={selectedBroker.lastSync}
              />

              <Detail
                label="Broker ID"
                value={selectedBroker.id}
              />
            </div>

            <div
              style={{
                padding: "16px 22px",
                borderTop:
                  "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() =>
                  setSelectedBroker(null)
                }
                style={{
                  border:
                    "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  borderRadius: "8px",
                  padding: "9px 14px",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
  valueColor = "#0f172a",
}: {
  label: string;
  value: string;
  description: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px",
        boxShadow:
          "0 4px 18px rgba(15,23,42,.04)",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "25px",
          lineHeight: 1.1,
          fontWeight: 800,
          color: valueColor,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "11px",
          color: "#64748b",
        }}
      >
        {description}
      </div>
    </div>
  );
}

function CommandStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        border:
          "1px solid rgba(148,163,184,.22)",
        background:
          "rgba(255,255,255,.04)",
        borderRadius: "10px",
        padding: "13px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: "#94a3b8",
          fontWeight: 800,
        }}
      >
        {number}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "4px",
          fontSize: "10px",
          color: "#cbd5e1",
          lineHeight: 1.55,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  style,
}: {
  label: string;
  style: React.CSSProperties;
}) {
  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 9px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Th({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px 16px",
        fontSize: "9px",
        fontWeight: 800,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderBottom:
          "1px solid #e2e8f0",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
  muted = false,
  align = "left",
}: {
  children: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
  align?: "left" | "right";
}) {
  return (
    <td
      style={{
        padding: "15px 16px",
        borderBottom:
          "1px solid #f1f5f9",
        fontSize: "12px",
        fontWeight: strong ? 750 : 500,
        color: muted
          ? "#64748b"
          : "#334155",
        whiteSpace: "nowrap",
        textAlign: align,
      }}
    >
      {children}
    </td>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#0f172a",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}