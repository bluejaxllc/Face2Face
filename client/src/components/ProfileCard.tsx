import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/distance";
import { MessageSquare, Lock, X, Play, Music, Palette, BookOpen, UserCheck, Ruler, Weight } from "lucide-react";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  gender: string;
  age: number;
  selfRating: number;
  isActive: boolean;
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  bumpMessage?: string | null;
  profilePhoto?: string | null;
}

interface ProfileCardProps {
  user: User;
  onClose: () => void;
  onConnect: () => void;
  distance: number | null;
}

export default function ProfileCard({ user, onClose, onConnect, distance }: ProfileCardProps) {
  const [, setLocation] = useLocation();

  // Get bump count to determine profile reveal level
  const { data: bumps = [] } = useQuery<any[]>({
    queryKey: ["/api/bumps", user.id],
    refetchOnWindowFocus: false,
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  };

  const hasConnected = bumps.length > 0;
  const isRevealed = bumps.length >= 2;

  const genderBadge = user.gender === 'male' ? '♂' : user.gender === 'female' ? '♀' : '⚥';
  const genderColor = user.gender === 'male' ? 'text-blue-400' : user.gender === 'female' ? 'text-pink-400' : 'text-purple-400';

  return (
    <Card className="fixed left-1/2 transform -translate-x-1/2 bottom-20 w-11/12 max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-[2000] p-0 max-h-[70vh] overflow-y-auto">
      <div className="relative pt-8 pb-4 px-6 flex flex-col items-center">
        {/* Abstract shape background */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-pink-500/20 to-blue-500/20" />

        <Avatar className="h-24 w-24 border-4 border-slate-900 shadow-xl z-10 bg-slate-800">
          {user.profilePhoto && (
            <AvatarImage src={user.profilePhoto} alt={`${user.firstName}'s photo`} />
          )}
          <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300">
            {getInitials(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>

        <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mt-4 z-10 w-full">
          <h3 className="text-2xl font-black text-white tracking-tight">
            {user.firstName}, <span className="text-pink-400">{user.age || 20}</span>
            <span className={`ml-2 text-lg ${genderColor}`}>{genderBadge}</span>
          </h3>

          {/* Stats row */}
          <div className="flex items-center justify-center mt-2 space-x-2 flex-wrap gap-1">
            <span className="inline-flex items-center justify-center bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-slate-300">Rating: </span>
              <span className="text-sm font-black text-white ml-1">{user.selfRating}/10</span>
            </span>
            {user.height && (
              <span className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-full px-2 py-1">
                <Ruler className="w-3 h-3 text-cyan-400 mr-1" />
                <span className="text-xs text-slate-300">{user.height}</span>
              </span>
            )}
            {user.weight && (
              <span className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-full px-2 py-1">
                <Weight className="w-3 h-3 text-orange-400 mr-1" />
                <span className="text-xs text-slate-300">{user.weight}</span>
              </span>
            )}
          </div>

          {/* Distance */}
          <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-2 text-center uppercase">
            {distance ? formatDistance(distance) : "Unknown"} · <span className="capitalize">{user.category}</span>
          </p>

          {!isRevealed && (
            <div className="mt-4 mb-2 grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <Music className="w-4 h-4 text-blue-400 mb-1" />
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Song</p>
                <p className="text-sm text-slate-200 font-semibold truncate">{user.favoriteSong || "Not set"}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <Palette className="w-4 h-4 text-pink-400 mb-1" />
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Color</p>
                <p className="text-sm text-slate-200 font-semibold truncate">{user.favoriteColor || "Not set"}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 col-span-2">
                <BookOpen className="w-4 h-4 text-purple-400 mb-1" />
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Field of Study/Work</p>
                <p className="text-sm text-slate-200 font-semibold truncate">{user.fieldOfStudy || "Not set"}</p>
              </div>
            </div>
          )}

          {user.seeking && !isRevealed && (
            <div className="mt-2 mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Seeking</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {user.seeking.split(",").map((item, i) => (
                  <span key={i} className="text-xs bg-pink-950/50 border border-pink-800/50 rounded-full px-2 py-0.5 text-pink-300">
                    {item.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isRevealed && (
            <div className="mt-4 mb-2 p-4 bg-slate-800/80 rounded-xl border border-pink-500/30">
              <div className="flex items-center text-pink-400 mb-2">
                <UserCheck className="w-5 h-5 mr-2" />
                <h4 className="font-bold">Mutual Connect Achieved!</h4>
              </div>
              <p className="text-sm text-slate-300 text-left">
                You've both connected with each other. The full profile is now revealed and direct messaging is enabled.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Interests</p>
                  <p className="text-xs text-white">{user.interests || "Not set"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Category</p>
                  <p className="text-xs text-white capitalize">{user.category}</p>
                </div>
                {user.seeking && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase">Seeking</p>
                    <p className="text-xs text-white">{user.seeking}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button
              className="flex-1 h-14 rounded-xl font-bold tracking-wide shadow-lg shadow-pink-500/25 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border border-pink-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={onConnect}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              {hasConnected ? "BUMP" : "CONNECT"}
            </Button>
            <Button
              className="flex-1 h-14 rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border border-blue-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => {
                onClose();
                setLocation(`/messages?userId=${user.id}`);
              }}
            >
              <MessageSquare className="w-5 h-5 mr-2 fill-current" />
              MESSAGE
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
