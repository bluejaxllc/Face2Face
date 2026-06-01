import { CSSProperties } from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  company?: string;
  category: string;
  profilePhoto?: string | null;
  isPremium?: boolean;
}

interface UserMarkerProps {
  user: User;
  position: { top: string; left: string };
  onClick: () => void;
}

import { Crown } from "lucide-react";

export default function UserMarker({ user, position, onClick }: UserMarkerProps) {
  const style: CSSProperties = {
    top: position.top,
    left: position.left,
    zIndex: user.isPremium ? 50 : 40,
  };

  const getInitials = (firstName: string, lastName: string, company?: string, category?: string) => {
    if (category === 'business' && company) {
      return `${company[0]}${(company.split(' ')[1] || '')[0] || ''}`.toUpperCase();
    }
    return `${firstName[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  };

  return (
    <div
      className={`user-marker relative ${user.category === "dating" ? "intimate-marker" : user.category === "business" ? "casual-marker" : "casual-marker"}`}
      style={style}
      onClick={onClick}
    >
      {user.isPremium && (
        <div className="absolute -top-3 -right-2 bg-yellow-500 rounded-full p-0.5 shadow-lg shadow-yellow-500/50 z-10 border border-yellow-200">
          <Crown className="w-3 h-3 text-white fill-yellow-200" />
        </div>
      )}
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
