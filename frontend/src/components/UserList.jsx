import React, { useState, useEffect } from "react";
import { getUsers } from "../lib/api";
import { Users, GraduationCap, User, UserX, Edit } from "lucide-react";
import { LoadingCard } from "./Loading";
import EmptyState from "./EmptyState";
import UserProfileModal from "./UserProfileModal";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.line}`,
    borderRadius: "12px", padding: "24px", ...style
  }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = "outline", type = "button", style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: variant === "primary" ? T.green : "transparent",
      color: variant === "primary" ? "white" : T.ink,
      border: variant === "primary" ? "none" : `1px solid ${T.line}`,
      padding: "6px 12px", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "12px", fontWeight: "500", opacity: disabled ? 0.6 : 1,
      fontFamily: "Plus Jakarta Sans, sans-serif",
      ...style
    }}
  >
    {children}
  </button>
);

const UserCard = ({ user, onEditClick }) => {
  const getRoleIcon = () => {
    switch (user.role) {
      case "admin": return <Users size={16} color={T.green} />;
      case "teacher": return <GraduationCap size={16} color={T.green} />;
      case "student": return <User size={16} color={T.green} />;
      default: return null;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case "admin": return "#DC2626";
      case "teacher": return "#1E7A57";
      case "student": return "#3E6CA6";
      default: return T.faint;
    }
  };

  return (
    <Card style={{ 
      marginBottom: "12px", 
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: `1px solid ${T.line}`,
      boxShadow: "0 1px 3px rgba(43, 58, 51, 0.04)",
    }}>
      <div 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        onClick={() => onEditClick(user.id)}
        onMouseEnter={(e) => {
          e.currentTarget.parentElement.style.transform = "translateY(-1px)";
          e.currentTarget.parentElement.style.boxShadow = "0 4px 12px rgba(43, 58, 51, 0.1), 0 2px 4px rgba(43, 58, 51, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.parentElement.style.transform = "translateY(0)";
          e.currentTarget.parentElement.style.boxShadow = "0 1px 3px rgba(43, 58, 51, 0.04)";
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            {getRoleIcon()}
            <h3 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
              color: T.ink
            }}>
              {user.name}
            </h3>
            <span style={{
              background: getRoleColor(),
              color: "white",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "500",
              textTransform: "capitalize"
            }}>
              {user.role}
            </span>
          </div>
          
          <div style={{ fontSize: "14px", color: T.ink2 }}>
            {user.role === "student" ? (
              <>
                <div>Username: {user.username}</div>
                {user.className ? (
                  <div style={{ color: T.green }}>Class: {user.className}</div>
                ) : (
                  <div style={{ color: T.faint }}>No class assigned</div>
                )}
              </>
            ) : (
              <>
                <div>Email: {user.email}</div>
                {user.className && <div>Class: {user.className}</div>}
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Btn 
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(user.id);
            }}
            variant="outline"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "4px",
              padding: "4px 8px"
            }}
          >
            <Edit size={14} />
            Edit
          </Btn>
          <div style={{ 
            fontSize: "12px", 
            color: T.faint,
            textAlign: "center" 
          }}>
            <div>Created</div>
            <div>{new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function UserList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [refreshTrigger]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
  };

  const handleUserDeleted = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    setSelectedUserId(null);
  };

  const groupedUsers = (users || []).reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {});

  if (loading) {
    return <LoadingCard message="Loading users..." />;
  }

  if (error) {
    return (
      <Card>
        <div style={{ color: "#DC2626", padding: "20px" }}>
          Error: {error}
        </div>
        <Btn onClick={loadUsers}>Retry</Btn>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{
          fontSize: "20px",
          fontFamily: "Fraunces, serif",
          color: T.ink,
          margin: 0
        }}>
          All Users ({users.length})
        </h2>
        <Btn onClick={loadUsers}>Refresh</Btn>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<UserX />}
          title="No Users Found"
          description="There are no users in the system yet. Start by creating teachers and students using the forms above."
        />
      ) : (
        <>
          {Object.entries(groupedUsers).map(([role, roleUsers]) => (
            <div key={role} style={{ marginBottom: "24px" }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: T.ink,
                marginBottom: "12px",
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {role}s ({roleUsers.length})
              </h3>
              {roleUsers.map(user => (
                <UserCard key={user.id} user={user} onEditClick={setSelectedUserId} />
              ))}
            </div>
          ))}
        </>
      )}
      
      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
      />
    </Card>
  );
}