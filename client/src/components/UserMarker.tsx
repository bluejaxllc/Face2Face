import { CSSProperties } from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  company?: string;
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

  const getInitials = (firstName: string, lastName: string, company?: string, category?: string) => {
    if (category === 'business' && company) {
      return `${company[0]}${(company.split(' ')[1] || '')[0] || ''}`.toUpperCase();
    }
    return `${firstName[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  };

  return (
    <div
      className={`user-marker ${user.category === "dating" ? "intimate-marker" : user.category === "business" ? "casual-marker" : "casual-marker"}`}
      style={style}
      onClick={onClick}
    >
      {user.profilePhoto ? (
        <img src={user.profilePhoto} alt={user.category === 'business' ? (user.company || user.firstName) : user.firstName} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="text-white text-xs font-bold">
          {getInitials(user.firstName, user.lastName, user.company, user.category)}
        </span>
      )}
    </div>
  );
}
