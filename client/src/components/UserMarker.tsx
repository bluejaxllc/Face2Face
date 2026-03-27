import { CSSProperties } from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  profilePhoto?: string | null;
}

interface UserMarkerProps {
  user: User;
  position: { top: string; left: string };
  onClick: () => void;
}

export default function UserMarker({ user, position, onClick }: UserMarkerProps) {
  const style: CSSProperties = {
    top: position.top,
    left: position.left,
    zIndex: 40,
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${(lastName || '')[0] || ''}`;
  };

  return (
    <div
      className={`user-marker ${user.category === "casual" ? "casual-marker" : "intimate-marker"}`}
      style={style}
      onClick={onClick}
    >
      {user.profilePhoto ? (
        <img src={user.profilePhoto} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="text-white text-xs font-bold">
          {getInitials(user.firstName, user.lastName)}
        </span>
      )}
    </div>
  );
}
