import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import ProfileCard from "@/components/ProfileCard";
import Map from "@/components/Map";
import { ChevronDown, Search, Heart, ArrowLeft, CalendarDays, MapPin } from "lucide-react";

type PrimaryMode = "groups" | "list";
type GroupSubTab = "feed" | "settings";
type ListSubTab = "feed" | "dates" | "settings";

import { useScrollSave } from "@/hooks/use-scroll-save";

export default function Explore() {
  const groupsScroll = useScrollSave("f2f_explore_scroll_groups");
  const listScroll = useScrollSave("f2f_explore_scroll_list");
  const datesScroll = useScrollSave("f2f_explore_scroll_dates");
  const listSettingsScroll = useScrollSave("f2f_explore_scroll_list_settings");
  const groupSettingsScroll = useScrollSave("f2f_explore_scroll_group_settings");
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>(() => 
    (localStorage.getItem("f2f_explore_primaryMode") as PrimaryMode) || "groups"
  );
  const [groupTab, setGroupTab] = useState<GroupSubTab>(() => 
    (localStorage.getItem("f2f_explore_groupTab") as GroupSubTab) || "feed"
  );
  const [listTab, setListTab] = useState<ListSubTab>(() => 
    (localStorage.getItem("f2f_explore_listTab") as ListSubTab) || "feed"
  );
  const [activeCategory, setActiveCategory] = useState<{title: string, groups: any[]} | null>(null);

  // Sync sub-menu position to localStorage
  useEffect(() => {
    localStorage.setItem("f2f_explore_primaryMode", primaryMode);
    localStorage.setItem("f2f_explore_groupTab", groupTab);
    localStorage.setItem("f2f_explore_listTab", listTab);
  }, [primaryMode, groupTab, listTab]);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);
  
  // Settings States
  const [listDistance, setListDistance] = useState("25");
  const [distanceUnit, setDistanceUnit] = useState<"mi" | "km">("mi");
  const [listGender, setListGender] = useState<"male" | "female" | "custom">("male");
  const [listTags, setListTags] = useState("");
  const [listAgeMin, setListAgeMin] = useState("18");
  const [listAgeMax, setListAgeMax] = useState("35");
  const [listDate, setListDate] = useState(false);

  const [groupDistance, setGroupDistance] = useState("25");
  const [groupDistanceUnit, setGroupDistanceUnit] = useState<"mi" | "km">("mi");
  const [groupPublic, setGroupPublic] = useState("");
  const [groupPrivate, setGroupPrivate] = useState("");
  const [groupTags, setGroupTags] = useState("");

  const publicGroups = [
    { name: "Fishing Lake van", members: 124, distance: "2 mi", seed: "f2f_1" },
    { name: "boating", members: 89, distance: "5 mi", seed: "f2f_2" },
    { name: "Skating at Park", members: 42, distance: "1 mi", seed: "f2f_3" },
    { name: "Hiking Trail 5", members: 210, distance: "8 mi", seed: "f2f_4" },
    { name: "Outdoor Yoga", members: 156, distance: "4 mi", seed: "f2f_5" },
    { name: "City Runners", members: 340, distance: "1 mi", seed: "f2f_6" }
  ];

  const privateGroups = [
    { name: "Hunting", members: 32, distance: "12 mi", seed: "f2f_7" },
    { name: "dance", members: 15, distance: "3 mi", seed: "f2f_8" },
    { name: "Gaming", members: 45, distance: "0 mi", seed: "f2f_9" },
    { name: "Secret Supper", members: 18, distance: "4 mi", seed: "f2f_10" },
    { name: "VR Club", members: 28, distance: "2 mi", seed: "f2f_11" },
    { name: "Book Club X", members: 10, distance: "1.5 mi", seed: "f2f_12" }
  ];

  const adultGroups = [
    { name: "Wine club", members: 85, distance: "3 mi", seed: "f2f_13" },
    { name: "Beer pong", members: 120, distance: "1 mi", seed: "f2f_14" },
    { name: "Brewery club", members: 92, distance: "5 mi", seed: "f2f_15" },
    { name: "Mixology 101", members: 40, distance: "2.5 mi", seed: "f2f_16" },
    { name: "Whiskey Tasting", members: 35, distance: "4 mi", seed: "f2f_17" },
    { name: "Late Night Trivia", members: 150, distance: "1.5 mi", seed: "f2f_18" }
  ];

  const renderGroupFeed = () => {
    if (activeCategory) {
      return (
        <div className="flex-1 overflow-y-auto w-full h-full text-slate-300 relative bg-slate-950 pb-20">
          <div className="w-full h-[64px] flex items-center px-4 border-b border-slate-800/80 bg-slate-900/40 sticky top-0 z-20 backdrop-blur-xl">
             <button onClick={() => setActiveCategory(null)} className="mr-3 p-1 rounded-full hover:bg-slate-800/50 transition-colors">
               <ArrowLeft className="w-6 h-6 text-slate-300 hover:text-rose-400 transition-colors" />
             </button>
             <h2 className="text-[20px] font-bold text-rose-500 tracking-tight">{activeCategory.title}</h2>
          </div>
          <div className="flex flex-col w-full divide-y divide-slate-800/60 pb-24">
            {activeCategory.groups.map((g, i) => (
              <div key={i} className="flex items-center px-5 py-4 hover:bg-slate-800/20 cursor-pointer transition-colors group">
                <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/50 shadow-sm relative group-hover:scale-105 transition-transform">
                  <img src={`https://picsum.photos/seed/${g.seed}/400/600`} alt={g.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                </div>
                
                <div className="flex flex-col flex-1 pl-4 pr-3 overflow-hidden">
                  <h3 className="text-white text-[17px] font-semibold tracking-tight leading-snug">{g.name}</h3>
                  <p className="text-slate-400 text-[13px] leading-snug mt-1 truncate">
                    {g.members} members • {g.distance} away
                  </p>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeCategory.title === "Private") {
                      toast({ title: "Request Sent", description: "Waiting for admin approval." });
                    } else {
                      toast({ title: "Joined!", description: `You joined ${g.name}.` });
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm transition-transform active:scale-95 shrink-0 ${
                    activeCategory.title === "Private" 
                      ? 'bg-slate-800 text-rose-400 border border-slate-700/50 hover:bg-slate-700' 
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {activeCategory.title === "Private" ? "Request" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const renderHorizontalSection = (title: string, groups: any[]) => (
      <div className="mb-6">
        <div className="flex justify-between items-end mb-3 px-4">
          <h2 className="text-[26px] font-bold text-rose-500 tracking-tight">{title}</h2>
          <button 
            onClick={() => setActiveCategory({ title, groups })}
            className="flex flex-col items-center cursor-pointer group"
          >
            <span className="text-[11px] font-extrabold text-rose-500 lowercase tracking-wider mb-0 hover:text-rose-400 transition-colors">all</span>
            <ChevronDown className="w-5 h-5 text-rose-500 group-hover:text-rose-400 transition-colors translate-y-[-4px]" strokeWidth={3} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden">
          {groups.map((g, i) => (
            <div key={i} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
              <img src={`https://picsum.photos/seed/${g.seed}/400/600`} alt={g.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
              <div className="absolute inset-0 bg-slate-950/40 pointer-events-none transition-colors group-hover:bg-slate-950/50" />
              <div className="absolute inset-0 flex items-center justify-center px-2 pointer-events-none text-center">
                <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-words">{g.name}</h3>
              </div>
            </div>
          ))}
          <div className="w-1 shrink-0 snap-end" />
        </div>
      </div>
    );

    return (
      <div {...groupsScroll} onScroll={groupsScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 relative pb-20">
        <div className="pt-8 pb-8">
          <div className="px-4 mb-6 flex gap-3 z-10 h-[52px]">
            <div className="w-[55%]">
              <button 
                onClick={() => toast({ title: "Group Builder", description: "The group creation flow is being built. Stay tuned!", variant: "default" })}
                className="w-full h-full bg-gradient-to-b from-rose-500 to-rose-600 text-white font-extrabold px-4 rounded-2xl text-[16px] shadow-[0_8px_30px_rgba(244,63,94,0.3)] flex items-center justify-center border border-rose-400/30 hover:scale-[1.02] active:scale-95 transition-transform"
              >
                Create group
              </button>
            </div>
            
            <div className="flex-1 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] flex items-center overflow-hidden focus-within:ring-1 ring-rose-500 transition-shadow">
              <div className="pl-3 pr-2 flex items-center justify-center h-full">
                <Search className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
              </div>
              
              <input 
                type="text" 
                placeholder="Search tags, keywords (e.g. 'hiking', 'denver')..." 
                className="bg-transparent text-[13px] text-white placeholder:text-slate-500 h-full w-full outline-none truncate pr-3" 
              />
            </div>
          </div>
          {renderHorizontalSection("Public", publicGroups)}
          {renderHorizontalSection("Private", privateGroups)}
          {renderHorizontalSection("21+", adultGroups)}
        </div>
      </div>
    );
  };

  const renderGroupSettings = () => (
    <div {...groupSettingsScroll} onScroll={groupSettingsScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 pb-24">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">distance</span>
          <div className="flex items-center">
            <span className="text-slate-500 mr-2 text-sm">[</span>
            <input 
              type="text" 
              value={groupDistance}
              onChange={(e) => setGroupDistance(e.target.value)}
              className="bg-transparent w-8 text-center outline-none text-white font-medium focus:ring-1 ring-rose-500 rounded px-1"
            />
            <span className="text-slate-500 text-sm ml-1 mr-4">]</span>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
              <button onClick={() => setGroupDistanceUnit("mi")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${groupDistanceUnit === 'mi' ? 'text-rose-500' : 'text-slate-500'}`}>MI</button>
              <span className="text-slate-600 text-[10px]">|</span>
              <button onClick={() => setGroupDistanceUnit("km")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${groupDistanceUnit === 'km' ? 'text-rose-500' : 'text-slate-500'}`}>KM</button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">public</span>
          <div className="flex items-center">
             <span className="text-slate-500 mr-2 text-sm">[</span>
             <input 
               type="text" 
               placeholder="Search"
               value={groupPublic}
               onChange={(e) => setGroupPublic(e.target.value)}
               className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
             />
             <span className="text-slate-500 ml-2 text-sm">]</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">private</span>
          <div className="flex items-center">
             <span className="text-slate-500 mr-2 text-sm">[</span>
             <input 
               type="text" 
               placeholder="Search"
               value={groupPrivate}
               onChange={(e) => setGroupPrivate(e.target.value)}
               className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
             />
             <span className="text-slate-500 ml-2 text-sm">]</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">tags</span>
          <div className="flex items-center">
             <span className="text-slate-500 mr-2 text-sm">[</span>
             <input 
               type="text" 
               placeholder="Search"
               value={groupTags}
               onChange={(e) => setGroupTags(e.target.value)}
               className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
             />
             <span className="text-slate-500 ml-2 text-sm">]</span>
          </div>
        </div>
      </div>
    </div>
  );

  const mockListProfiles = [
    { 
      id: 801, username: "shay", firstName: "shay", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 27, city: "Denver (Jefferson co.)", quote: '"lover girl and caring"', seed: "p1", selfRating: 8, bio: "lover girl and caring", interests: "Concerts, Food", profilePhoto: "https://picsum.photos/seed/p1/200/200"
    },
    { 
      id: 802, username: "aly", firstName: "Aly", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 30, city: "Byers", quote: '"Hello 😊"', seed: "p2", selfRating: 7, bio: "Hello 😊", interests: "Travel", profilePhoto: "https://picsum.photos/seed/p2/200/200"
    },
    { 
      id: 803, username: "kyniah", firstName: "kyniah", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 29, city: "Denver", quote: '"iykYK it\'s Simple 😌"', seed: "p3", selfRating: 9, bio: "iykYK it's Simple 😌", interests: "Hiking", profilePhoto: "https://picsum.photos/seed/p3/200/200"
    },
    { 
      id: 804, username: "kia", firstName: "kia", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 22, city: "Colorado Springs", quote: '"Here for vibes, laughs, and snack..."', seed: "p4", selfRating: 8, bio: "Here for vibes, laughs, and snacks", interests: "Movies", profilePhoto: "https://picsum.photos/seed/p4/200/200"
    },
    { 
      id: 805, username: "aaliyah", firstName: "aaliyah", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 24, city: "Denver", quote: '"i\'m wood smoker and i like to ba..."', seed: "p5", selfRating: 8, bio: "i'm wood smoker and i like to bake", interests: "Cooking", profilePhoto: "https://picsum.photos/seed/p5/200/200"
    },
    { 
      id: 806, username: "kaylin", firstName: "Kaylin", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 29, city: "Castle Rock", quote: '"Sarcasm, kindness, good vibes"', seed: "p6", selfRating: 9, bio: "Sarcasm, kindness, good vibes", interests: "Comedy", profilePhoto: "https://picsum.photos/seed/p6/200/200"
    },
    { 
      id: 807, username: "ladii", firstName: "ladii", lastName: "", category: "dating", gender: "female", isActive: true,
      age: 28, city: "Aurora", quote: '"All about money it\'s all about me"', seed: "p7", selfRating: 10, bio: "All about money it's all about me", interests: "Business", profilePhoto: "https://picsum.photos/seed/p7/200/200"
    },
  ];

  const renderListView = () => {
    return (
      <div {...listScroll} onScroll={listScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 pb-20">
        <div className="flex flex-col w-full divide-y divide-slate-800/60 pb-24">
          {mockListProfiles.map((p, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedUserForProfile(p)}
              className="flex items-center px-5 py-4 hover:bg-slate-800/20 cursor-pointer transition-colors group"
            >
              <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/50 shadow-sm relative group-hover:scale-105 transition-transform">
                <img src={p.profilePhoto} alt={p.firstName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              </div>
              
              <div className="flex flex-col flex-1 pl-4 pr-3 overflow-hidden">
                <h3 className="text-white text-[19px] font-semibold tracking-tight leading-snug">{p.firstName}</h3>
                <p className="text-slate-400 text-[14px] leading-snug mt-0.5 truncate">
                  {p.age}, {p.city}
                </p>
                <p className="text-slate-300/80 text-[14px] italic mt-1 leading-snug truncate">
                  {p.quote}
                </p>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); toast({ title: "Bump sent! ✨", description: `You bumped ${p.firstName}. They will be notified.` }); }}
                  className="px-2.5 py-1 w-16 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-rose-500 hover:text-rose-400 font-bold text-[10px] tracking-wider transition-transform active:scale-95"
                >
                   BUMP
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setLocation("/"); }}
                  className="px-2.5 py-1 w-16 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-rose-500 hover:text-rose-400 font-bold text-[10px] tracking-wider transition-transform active:scale-95"
                >
                   MAP
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const mockDatesList = [
    { name: "Aly", date: "Friday, 8:00 PM", location: "Downtown Wine Bar", status: "Confirmed", seed: "p2" },
    { name: "kyniah", date: "Saturday, 12:30 PM", location: "Coffee Roasters", status: "Pending", seed: "p3" },
    { name: "kia", date: "Next Tuesday, 7:00 PM", location: "Sushi Roku", status: "Confirmed", seed: "p4" }
  ];

  const renderDatesList = () => (
    <div {...datesScroll} onScroll={datesScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 pb-20">
      <div className="flex flex-col w-full divide-y divide-slate-800/60 pb-24">
        {mockDatesList.map((d, i) => (
          <div key={i} className="flex items-center px-5 py-4 hover:bg-slate-800/20 cursor-pointer transition-colors group">
            <div className="w-[60px] h-[60px] rounded-full overflow-hidden shrink-0 bg-slate-800 border border-slate-700/50 shadow-sm relative group-hover:scale-105 transition-transform">
              <img src={`https://picsum.photos/seed/${d.seed}/150/150`} alt={d.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
            </div>
            
            <div className="flex flex-col flex-1 pl-4 pr-3 overflow-hidden">
              <div className="flex justify-between items-center">
                 <h3 className="text-white text-[17px] font-semibold tracking-tight">{d.name}</h3>
                 <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${d.status === "Confirmed" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>{d.status}</span>
              </div>
              <p className="text-rose-400 font-semibold text-[14px] leading-snug mt-1 truncate flex items-center">
                <CalendarDays className="w-4 h-4 mr-1.5" />
                {d.date}
              </p>
              <p className="text-slate-400 text-[13px] mt-1 truncate flex items-center">
                <MapPin className="w-4 h-4 mr-1.5" />
                {d.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListSettings = () => (
    <div {...listSettingsScroll} onScroll={listSettingsScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 pb-20">
      <div className="flex flex-col w-full pb-24">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">distance</span>
          <div className="flex items-center">
            <span className="text-slate-500 mr-2 text-sm">[</span>
            <input 
              type="text" 
              value={listDistance}
              onChange={(e) => setListDistance(e.target.value)}
              className="bg-transparent w-8 text-center outline-none text-white font-medium focus:ring-1 ring-rose-500 rounded px-1"
            />
            <span className="text-slate-500 text-sm ml-1 mr-4">]</span>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
              <button onClick={() => setDistanceUnit("mi")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'mi' ? 'text-rose-500' : 'text-slate-500'}`}>MI</button>
              <span className="text-slate-600 text-[10px]">|</span>
              <button onClick={() => setDistanceUnit("km")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'km' ? 'text-rose-500' : 'text-slate-500'}`}>KM</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">sex</span>
          <div className="flex items-center space-x-4">
             <button onClick={() => setListGender("male")} className={`text-sm lowercase font-medium transition-colors ${listGender === 'male' ? 'text-rose-500' : 'text-slate-600'}`}>male</button>
             <button onClick={() => setListGender("female")} className={`text-sm lowercase font-medium transition-colors ${listGender === 'female' ? 'text-rose-500' : 'text-slate-600'}`}>female</button>
             <button onClick={() => setListGender("custom")} className={`text-sm lowercase font-medium transition-colors ${listGender === 'custom' ? 'text-rose-500' : 'text-slate-600'}`}>custom</button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">tags</span>
          <div className="flex items-center">
             <span className="text-slate-500 mr-2 text-sm">[</span>
             <input 
               type="text" 
               placeholder="Search"
               value={listTags}
               onChange={(e) => setListTags(e.target.value)}
               className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
             />
             <span className="text-slate-500 ml-2 text-sm">]</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="font-bold tracking-wide">Age</span>
          <div className="flex items-center">
            <span className="text-slate-500 mr-2 text-sm">[</span>
            <input 
              type="text" 
              value={listAgeMin}
              onChange={(e) => setListAgeMin(e.target.value)}
              className="bg-transparent w-6 text-center outline-none text-white font-medium"
            />
            <span className="text-slate-500 mx-1">-</span>
            <input 
              type="text" 
              value={listAgeMax}
              onChange={(e) => setListAgeMax(e.target.value)}
              className="bg-transparent w-6 text-center outline-none text-white font-medium"
            />
            <span className="text-slate-500 ml-2 text-sm">]</span>
          </div>
        </div>


      </div>
    </div>
  );

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden bg-slate-950">
      {/* ═══════ Primary Header: Groups / List view ═══════ */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="w-full h-[64px] flex items-center justify-center">
          <button 
            onClick={() => { setPrimaryMode("groups"); setGroupTab("feed"); setActiveCategory(null); }}
            className="px-2 relative group pb-1 mr-3"
          >
            <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "groups" ? "text-rose-500" : "text-slate-500"}`}>Groups</span>
            {primaryMode === "groups" && (
              <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-rose-500 rounded-full translate-y-1 mx-2" />
            )}
          </button>
          <span className="text-slate-600 font-light text-[22px]">/</span>
          <button 
            onClick={() => { setPrimaryMode("list"); setActiveCategory(null); }}
            className="px-2 relative group pb-1 ml-3"
          >
            <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "list" ? "text-rose-500" : "text-slate-500"}`}>List view</span>
            {primaryMode === "list" && (
              <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-rose-500 rounded-full translate-y-1 mx-2" />
            )}
          </button>
        </div>

        {/* ═══════ Sub-tabs (Only visible in Groups Mode) ═══════ */}
        {primaryMode === "groups" && !activeCategory && (
          <div className="w-full flex border-t border-slate-800/50 h-[44px]">
            <button 
              onClick={() => {
                const saved = localStorage.getItem('face2face_filterOptions');
                let options: any = { showGroups: true };
                if (saved) {
                  try {
                    const parsed = JSON.parse(saved);
                    options = { ...parsed };
                    // Reset ALL filters that begin with "show"
                    Object.keys(options).forEach(key => {
                      if (key.startsWith('show')) options[key] = false;
                    });
                  } catch (e) {}
                }
                
                // Explicitly set all known top-toolbar show toggles to false
                const explicitlyFalseKeys = ['showAll', 'showMen', 'showWomen', 'showDates', 'showHotspots', 'showNearby', 'showProfessionals', 'showRecruiters', 'showStartups', 'showFriendships', 'showBusiness', 'showDating'];
                explicitlyFalseKeys.forEach(k => options[k] = false);
                options.showGroups = true;
                
                localStorage.setItem('face2face_filterOptions', JSON.stringify(options));
                setLocation("/");
              }}
              className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/30 cursor-pointer"
            >
              <span className="text-sm font-semibold tracking-wide text-slate-500 group-hover:text-white transition-colors">Groups map</span>
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setGroupTab("settings")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${groupTab === "settings" ? "text-rose-500" : "text-slate-500"}`}>Settings</span>
              {groupTab === "settings" && <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-rose-500 rounded-t-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
            </button>
          </div>
        )}

        {/* ═══════ Sub-tabs (Only visible in List Mode) ═══════ */}
        {primaryMode === "list" && (
          <div className="w-full flex border-t border-slate-800/50 h-[44px]">
            <button 
              onClick={() => setListTab("feed")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "feed" ? "text-rose-500" : "text-slate-500"}`}>User list</span>
              {listTab === "feed" && <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-rose-500 rounded-t-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setListTab("dates")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "dates" ? "text-rose-500" : "text-slate-500"}`}>Dates list</span>
              {listTab === "dates" && <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-rose-500 rounded-t-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setListTab("settings")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "settings" ? "text-rose-500" : "text-slate-500"}`}>Settings</span>
              {listTab === "settings" && <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-rose-500 rounded-t-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
            </button>
          </div>
        )}
      </div>

      {/* ═══════ Main Content Area ═══════ */}
      <div 
        className="fixed left-0 right-0 overflow-hidden" 
        style={{ top: ((primaryMode === "groups" && !activeCategory) || primaryMode === "list") ? "108px" : "64px", bottom: "60px" }}
      >
        {primaryMode === "groups" ? (
          groupTab === "feed" ? renderGroupFeed() : renderGroupSettings()
        ) : (
          listTab === "feed" ? renderListView() : 
          listTab === "dates" ? renderDatesList() : renderListSettings()
        )}
      </div>

      <BottomNavigation />
      
      {selectedUserForProfile && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <ProfileCard
            user={selectedUserForProfile}
            onClose={() => setSelectedUserForProfile(null)}
            onConnect={() => {
              toast({ title: "Bump sent! ✨", description: `You bumped ${selectedUserForProfile.firstName}. They will be notified.` });
              setSelectedUserForProfile(null);
            }}
            distance={1.5}
          />
        </div>
      )}
    </PageTransition>
  );
}
