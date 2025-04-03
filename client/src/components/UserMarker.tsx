import { CSSProperties } from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
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
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  return (
    <div 
      className={`user-marker ${user.category === "bump" ? "bump-marker" : "grind-marker"}`}
      style={style}
      onClick={onClick}
    >
      <span className="text-white text-xs font-bold">
        {getInitials(user.firstName, user.lastName)}
      </span>
    </div>
  );
}
