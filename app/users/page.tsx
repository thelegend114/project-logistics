"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type User = {
  id: string;
  company_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  phone: string | null;
  active: boolean | null;
  created_at: string;
};

const roles = [
  "owner",
  "admin",
  "dispatcher",
  "safety",
  "accounting",
  "maintenance",
  "driver",
  "customer",
  "broker",
];

export default function UsersPage() {
  const { language } = useLanguage();
  const isES = language === "ES";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddUser, setShowAddUser] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [savingEdit, setSavingEdit] =
    useState(false);
  const [passwordUser, setPasswordUser] =
    useState<User | null>(null);
  const [savingPassword, setSavingPassword] =
    useState(false);
  const [passwordForm, setPasswordForm] =
    useState({ password: "", confirmPassword: "" });

  const [creatingUser, setCreatingUser] =
    useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "driver",
    password: "",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "driver",
  });

  async function loadUsers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, company_id, full_name, email, role, phone, active, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    const active = users.filter(
      (user) => user.active !== false
    ).length;

    const inactive = users.filter(
      (user) => user.active === false
    ).length;

    const owners = users.filter(
      (user) =>
        (user.role || "").toLowerCase() === "owner"
    ).length;

    const admins = users.filter(
      (user) =>
        (user.role || "").toLowerCase() === "admin"
    ).length;

    return {
      total: users.length,
      active,
      inactive,
      owners,
      admins,
    };
  }, [users]);

  async function toggleUser(user: User) {
    setSavingId(user.id);
    setError("");
    setSuccess("");

    const nextActive = user.active === false;

    const { error } = await supabase
      .from("users")
      .update({
        active: nextActive,
      })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setSavingId("");
      return;
    }

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              active: nextActive,
            }
          : item
      )
    );

    setSavingId("");
  }

  function updateForm(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      full_name: "",
      email: "",
      phone: "",
      role: "driver",
      password: "",
    });
  }

  function closeAddUser() {
    if (creatingUser) {
      return;
    }

    setShowAddUser(false);
    resetForm();
    setError("");
  }

  function openEditUser(user: User) {
    setError("");
    setSuccess("");
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "driver",
    });
  }

  function openPasswordReset(user: User) {
    setError("");
    setSuccess("");
    setPasswordUser(user);
    setPasswordForm({
      password: "",
      confirmPassword: "",
    });
  }

  function closePasswordReset() {
    if (savingPassword) return;
    setPasswordUser(null);
    setPasswordForm({
      password: "",
      confirmPassword: "",
    });
    setError("");
  }

  async function savePasswordReset() {
    if (!passwordUser) return;

    setError("");
    setSuccess("");

    if (passwordForm.password.length < 8) {
      setError("Temporary password must contain at least 8 characters.");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch(
        `/api/users/${passwordUser.id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: passwordForm.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
  setError(
    result.error ||
      (isES
        ? "No se pudo restablecer la contraseña del usuario."
        : "Unable to reset user password.")
  );
  return;
}

      setSuccess(
  isES
    ? `La contraseña temporal de ${
        passwordUser.full_name ||
        passwordUser.email ||
        "este usuario"
      } se actualizó correctamente.`
    : `Temporary password for ${
        passwordUser.full_name ||
        passwordUser.email ||
        "this user"
      } was updated successfully.`);
      closePasswordReset();
    } catch (error) {
      console.error(error);
      setError(
        isES
          ? "No se pudo conectar con el servicio de restablecimiento de contraseñas."
          : "Unable to connect to the password service."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  function closeEditUser() {
    if (savingEdit) return;
    setEditingUser(null);
    setEditForm({
      full_name: "",
      email: "",
      phone: "",
      role: "driver",
    });
    setError("");
  }

  function updateEditForm(field: keyof typeof editForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  async function saveEditUser() {
    if (!editingUser) return;
    setError("");
    setSuccess("");
    const fullName = editForm.full_name.trim();
    const email = editForm.email.trim().toLowerCase();
    const phone = editForm.phone.trim();
    const role = editForm.role.trim().toLowerCase();

    if (!fullName) {
  setError(isES ? "El nombre completo es obligatorio." : "Full name is required.");
  return;
}

if (!email) {
  setError(isES ? "El correo electrónico es obligatorio." : "Email is required.");
  return;
}

if (!role) {
  setError(isES ? "Selecciona un rol." : "Please select a role.");
  return;
}

    setSavingEdit(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, phone, role }),
      });
      const result = await response.json();
      if (!response.ok) {
  setError(
    result.error ||
      (isES
        ? "No se pudo actualizar el usuario."
        : "Unable to update user.")
  );
  return;
}

if (result.user) {
  setUsers((current) =>
    current.map((item) =>
      item.id === editingUser.id ? result.user : item
    )
  );
}

setSuccess(
  isES
    ? `El usuario ${fullName} se actualizó correctamente.`
    : `User ${fullName} was updated successfully.`
);

setEditingUser(null);

setEditForm({
  full_name: "",
  email: "",
  phone: "",
  role: "driver",
});
    } catch (error) {
      console.error(error);
      setError(
  isES
    ? "No se pudo conectar con el servicio de actualización de usuarios."
    : "Unable to connect to the user update service."
);
    } finally {
      setSavingEdit(false);
    }
  }

  async function createUser() {
    setError("");
    setSuccess("");

    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password;
    const role = form.role;

    if (!fullName) {
  setError(
    isES
      ? "El nombre completo es obligatorio."
      : "Full name is required."
  );
  return;
}

if (!email) {
  setError(
    isES
      ? "El correo electrónico es obligatorio."
      : "Email is required."
  );
  return;
}

if (!password || password.length < 8) {
  setError(
    isES
      ? "La contraseña debe contener al menos 8 caracteres."
      : "Password must contain at least 8 characters."
  );
  return;
}

if (!role) {
  setError(
    isES
      ? "Selecciona un rol."
      : "Please select a role."
  );
  return;
}

    setCreatingUser(true);

    try {
      const response = await fetch(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            email,
            phone,
            role,
            password,
          }),
        }
      );

      const result = await response.json();

    if (!response.ok) {
  setError(
    result.error ||
      (isES
        ? "No se pudo crear el usuario."
        : "Unable to create user.")
  );
  return;
}

      if (result.user) {
        setUsers((current) => [
          result.user,
          ...current,
        ]);
      }

      setSuccess(
  isES
    ? `El usuario ${fullName} se creó correctamente.`
    : `User ${fullName} was created successfully.`
);

      resetForm();
      setShowAddUser(false);
    } catch (error) {
      console.error(error);

     setError(
  isES
    ? "No se pudo conectar con el servicio de creación de usuarios."
    : "Unable to connect to the user creation service."
);
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#64748b",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
                marginBottom: "8px",
              }}
            >
              Project Logistics
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing:
                  "-0.03em",
              }}
            >
              {isES ? "Usuarios" : "Users"}
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              {isES
              ? "Administra usuarios, roles y estado de acceso."
              : "Manage users, roles and access status."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowAddUser(true);
              }}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 15px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + {isES ? "Agregar usuario" : "Add User"}
            </button>

            <button
              onClick={loadUsers}
              style={{
                background: "#ffffff",
                color: "#0f172a",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "10px 15px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border:
                "1px solid #fecaca",
              color: "#991b1b",
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              border:
                "1px solid #bbf7d0",
              color: "#166534",
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            title={isES ? "Total de usuarios" : "Total Users"}
            value={stats.total}
            subtitle={isES ? "Registrados" : "Registered"}
          />

          <StatCard
            title={isES ? "Usuarios activos" : "Active Users"}
            value={stats.active}
            subtitle={isES ? "Pueden acceder al sistema" : "Can access system"}
          />

          <StatCard
            title={isES ? "Inactivos" : "Inactive"}
            value={stats.inactive}
            subtitle={isES ? "Acceso deshabilitado" : "Access disabled"}
          />

          <StatCard
            title={isES ? "Propietarios" : "Owners"}
            value={stats.owners}
            subtitle={isES ? "Cuentas de propietario" : "Owner accounts"}
          />

          <StatCard
            title={isES ? "Administradores" : "Admins"}
            value={stats.admins}
            subtitle={isES ? "Cuentas de administrador" : "Admin accounts"}
          />
        </div>

        <section style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                User Directory
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Users currently
                registered in Project
                Logistics.
              </p>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                color: "#475569",
                borderRadius: "999px",
                padding: "7px 10px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {users.length} USERS
            </div>
          </div>

         {loading ? (
  <LoadingState />
) : users.length === 0 ? (
  <EmptyState
    text={isES ? "No se encontraron usuarios." : "No users found."}
  />
) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>
                      User
                    </th>
                    <th style={thStyle}>
                      Email
                    </th>
                    <th style={thStyle}>
                      Phone
                    </th>
                    <th style={thStyle}>
                      Role
                    </th>
                    <th style={thStyle}>
                      Status
                    </th>
                    <th style={thStyle}>
                      Created
                    </th>
                    <th style={thStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight: 800,
                          }}
                        >
                          {user.full_name ||
                            "Unnamed User"}
                        </div>

                        <div
                          style={{
                            marginTop: "3px",
                            color:
                              "#94a3b8",
                            fontSize: "10px",
                          }}
                        >
                          ID:{" "}
                          {user.id.slice(
                            0,
                            8
                          )}
                          ...
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {user.email || "—"}
                      </td>

                      <td style={tdStyle}>
                        {user.phone || "—"}
                      </td>

                      <td style={tdStyle}>
                        <RoleBadge
                          role={user.role}
                        />
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge
                          active={
                            user.active !==
                            false
                          }
                        />
                      </td>

                      <td style={tdStyle}>
                        {formatDate(
                          user.created_at
                        )}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => openEditUser(user)}
                            style={{
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              borderRadius: "8px",
                              padding: "7px 10px",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                           {isES ? "Editar" : "Edit"}
                          </button>
                          <button
                            onClick={() => openPasswordReset(user)}
                            style={{
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              borderRadius: "8px",
                              padding: "7px 10px",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {isES ? "Restablecer contraseña" : "Reset Password"}
                          </button>

                          <button
                            onClick={() => toggleUser(user)}
                            disabled={savingId === user.id}
                          style={{
                            border:
                              "1px solid #cbd5e1",
                            background:
                              user.active ===
                              false
                                ? "#dcfce7"
                                : "#ffffff",
                            color:
                              user.active ===
                              false
                                ? "#166534"
                                : "#334155",
                            borderRadius:
                              "8px",
                            padding:
                              "7px 10px",
                            fontSize:
                              "11px",
                            fontWeight: 800,
                            cursor:
                              savingId ===
                              user.id
                                ? "wait"
                                : "pointer",
                          }}
                        >
                          {savingId ===
                          user.id
                            ? "Saving..."
                            : user.active ===
                                false
                              ? "Activate"
                              : "Deactivate"}
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          style={{
            ...sectionStyle,
            marginTop: "20px",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              Supported Roles
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Project Logistics role
              structure.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {roles.map((role) => (
              <span
                key={role}
                style={{
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "999px",
                  padding: "8px 11px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#475569",
                  textTransform:
                    "capitalize",
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: "20px",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "22px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#94a3b8",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.08em",
              marginBottom: "8px",
            }}
          >
            Access Control
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            Role-Based Permissions
          </h2>

          <p
            style={{
              margin: "10px 0 0",
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
              maxWidth: "850px",
            }}
          >
            Users will receive access
            according to their assigned
            role. Owners and
            administrators will control
            operational permissions,
            while drivers, accounting,
            safety and other teams will
            receive access to the areas
            required for their work.
          </p>

          <div
            style={{
              marginTop: "16px",
              display: "inline-block",
              background: "#1e293b",
              borderRadius: "10px",
              padding: "11px 13px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
          >
            Owner → Admin → Team Role →
            Operational Access
          </div>
        </section>

        <div
          style={{
            marginTop: "28px",
            padding: "20px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          <strong
            style={{ color: "#0f172a" }}
          >
            Project Logistics
          </strong>
          {" · "}
          User Management
          {" · "}
          Secure role-based access
        </div>
      </div>

      {showAddUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow:
                "0 25px 60px rgba(15,23,42,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "22px",
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#64748b",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                      marginBottom: "6px",
                    }}
                  >
                    {isES ? "Gestión de usuarios" : "User Management"}
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: 800,
                    }}
                  >
                    {isES ? "Agregar usuario" : "Add User"}
                  </h2>
                </div>

                <button
                  onClick={closeAddUser}
                  disabled={creatingUser}
                  style={{
                    width: "34px",
                    height: "34px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "8px",
                    background:
                      "#ffffff",
                    color: "#475569",
                    cursor:
                      creatingUser
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "22px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: "15px",
                }}
              >
                <FormField
                  label={isES ? "Nombre completo" : "Full Name"}
                  value={form.full_name}
                  onChange={(value) =>
                    updateForm(
                      "full_name",
                      value
                    )
                  }
                  placeholder={isES ? "Juan Pérez" : "John Smith"}
                />

                <FormField
                  label={isES ? "Correo electrónico" : "Email"}
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateForm(
                      "email",
                      value
                    )
                  }
                  placeholder={isES ? "juan@ejemplo.com" : "john@example.com"}
                />

               <FormField
                 label={isES ? "Teléfono" : "Phone"}
                 value={form.phone}
                 onChange={(value) =>
                   updateForm(
                     "phone",
                    value
               )
              }
                  placeholder="(555) 555-5555"
              />
                <div>
                  <label
                    style={labelStyle}
                  >
                    {isES ? "Rol" : "Role"}
                  </label>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateForm(
                        "role",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      creatingUser
                    }
                    style={
                      inputStyle
                    }
                  >
                    {roles.map((role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {role
                          .charAt(0)
                          .toUpperCase() +
                          role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <FormField
                  label={isES ? "Contraseña temporal" : "Temporary Password"}
                  type="password"
                  value={form.password}
                  onChange={(value) =>
                    updateForm(
                  "password",
                    value
                  )
                }
                  placeholder={
                  isES
                  ? "Mínimo 8 caracteres"
                  : "Minimum 8 characters"
                }
              />

                <div
                  style={{
                    background:
                      "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px",
                    fontSize: "12px",
                    color: "#64748b",
                    lineHeight: 1.5,
                  }}
                >
                  The new user will be
                  created in Supabase
                  Authentication and
                  Project Logistics
                  automatically.
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    background: "#fee2e2",
                    border:
                      "1px solid #fecaca",
                    color: "#991b1b",
                    padding:
                      "12px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={closeAddUser}
                  disabled={
                    creatingUser
                  }
                  style={{
                    background:
                      "#ffffff",
                    color: "#334155",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding:
                      "10px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor:
                      creatingUser
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isES ? "Cancelar" : "Cancel"}
                </button>

                <button
                  onClick={createUser}
                  disabled={
                    creatingUser
                  }
                  style={{
                    background:
                      creatingUser
                        ? "#64748b"
                        : "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding:
                      "10px 18px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor:
                      creatingUser
                        ? "wait"
                        : "pointer",
                  }}
                >{creatingUser
                ? isES
                ? "Creando..."
                : "Creating..."
                : isES
                ? "Crear usuario"
                : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {passwordUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 120,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
               background: "#f8fafc",
              borderRadius: "18px",
              boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "22px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "6px",
                    }}
                  >
                    {isES ? "Seguridad" : "Security"}
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: 800,
                    }}
                  >
                    {isES ? "Restablecer contraseña" : "Reset Password"}
                  </h2>
                </div>
                <button
                  onClick={closePasswordReset}
                  disabled={savingPassword}
                  style={{
                    width: "34px",
                    height: "34px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#475569",
                    cursor: savingPassword ? "not-allowed" : "pointer",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "22px" }}>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                
  {isES
    ? `Establece una contraseña temporal para ${
        passwordUser.full_name ||
        passwordUser.email ||
        "este usuario"
      }. No compartas contraseñas por chat o correo electrónico.`
    : `Set a temporary password for ${
        passwordUser.full_name ||
        passwordUser.email ||
        "this user"
      }. Do not share passwords through chat or email.`}
   </div>
              

             <div style={{ display: "grid", gap: "15px" }}>
  <FormField
    label={isES ? "Contraseña temporal" : "Temporary Password"}
    type="password"
    value={passwordForm.password}
    onChange={(value) =>
      setPasswordForm((current) => ({
        ...current,
        password: value,
      }))
    }
    placeholder={
      isES
        ? "Mínimo 8 caracteres"
        : "Minimum 8 characters"
    }
  />

  <FormField
    label={isES ? "Confirmar contraseña" : "Confirm Password"}
    type="password"
    value={passwordForm.confirmPassword}
    onChange={(value) =>
      setPasswordForm((current) => ({
        ...current,
        confirmPassword: value,
      }))
    }
    placeholder={
      isES
        ? "Repita la contraseña"
        : "Repeat the password"
    }
  />
</div>
              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={closePasswordReset}
                  disabled={savingPassword}
                  style={{
                    background: "#ffffff",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: savingPassword ? "not-allowed" : "pointer",
                  }}
                >
                  {isES ? "Cancelar" : "Cancel"}
                </button>
                <button
                  onClick={savePasswordReset}
                  disabled={savingPassword}
                  style={{
                    background: savingPassword ? "#64748b" : "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: savingPassword ? "wait" : "pointer",
                  }}
                >
                  
                   {savingPassword
                  ? isES
                  ? "Guardando..."
                  : "Saving..."
                  : isES
                  ? "Establecer contraseña"
                  : "Set Password"}

                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 110,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "22px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>User Management</div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                  {isES ? "Editar usuario" : "Edit User"}
                 </h2>
                </div>
                <button onClick={closeEditUser} disabled={savingEdit} style={{ width: "34px", height: "34px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#ffffff", color: "#475569", cursor: savingEdit ? "not-allowed" : "pointer", fontSize: "18px" }}>×</button>
              </div>
            </div>
            <div style={{ padding: "22px" }}>
              <div style={{ display: "grid", gap: "15px" }}>
                <FormField label="Full Name" value={editForm.full_name} onChange={(value) => updateEditForm("full_name", value)} placeholder="John Smith" />
                <FormField label="Email" type="email" value={editForm.email} onChange={(value) => updateEditForm("email", value)} placeholder="john@example.com" />
                <FormField label="Phone" value={editForm.phone} onChange={(value) => updateEditForm("phone", value)} placeholder="(555) 555-5555" />
                <div>
                  <label style={labelStyle}>Role</label>
                  <select value={editForm.role} onChange={(event) => updateEditForm("role", event.target.value)} disabled={savingEdit} style={inputStyle}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                  {isES
                ? "Cambiar el rol modifica el acceso del usuario a Project Logistics. Los cambios de contraseña se gestionan por separado."
                : "Editing the role changes the user's Project Logistics access. Password changes are handled separately."}
                </div>
              </div>
              {error && (
                <div style={{ marginTop: "16px", background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 14px", borderRadius: "10px", fontSize: "13px" }}>{error}</div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button onClick={closeEditUser} disabled={savingEdit} style={{ background: "#ffffff", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", fontWeight: 700, cursor: savingEdit ? "not-allowed" : "pointer" }}>Cancel</button>
                <button
  onClick={saveEditUser}
  disabled={savingEdit}
  style={{
    background: savingEdit ? "#64748b" : "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: savingEdit ? "wait" : "pointer",
  }}
>
  {savingEdit
    ? isES
      ? "Guardando..."
      : "Saving..."
    : isES
      ? "Guardar cambios"
      : "Save Changes"}
</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border:
          "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "25px",
          fontWeight: 800,
          letterSpacing:
            "-0.03em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "11px",
          color: "#94a3b8",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: string | null;
}) {
  const value = role || "unknown";

  return (
    <span
      style={{
        display: "inline-block",
        background: "#eff6ff",
        color: "#1d4ed8",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "10px",
        fontWeight: 800,
        textTransform:
          "capitalize",
      }}
    >
      {value}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        background: active
          ? "#dcfce7"
          : "#fee2e2",
        color: active
          ? "#166534"
          : "#991b1b",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "10px",
        fontWeight: 800,
      }}
    >
      ● {active ? "Active" : "Inactive"}
    </span>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        padding: "45px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      Loading users...
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        padding: "45px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      {text}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border:
    "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "22px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px",
  borderBottom:
    "1px solid #e2e8f0",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 10px",
  borderBottom:
    "1px solid #f1f5f9",
  verticalAlign: "middle",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#334155",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border:
    "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "13px",
  outline: "none",
};