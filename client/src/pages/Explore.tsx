import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import ProfileCard from "@/components/ProfileCard";
import Map from "@/components/Map";
import { ChevronDown, Search, Heart, ArrowLeft, CalendarDays, MapPin, Plus, ImagePlus, Camera, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


type PrimaryMode = "groups" | "list";
type GroupSubTab = "feed" | "settings";
type ListSubTab = "feed" | "dates" | "settings";

import { useScrollSave } from "@/hooks/use-scroll-save";
import { CategoryKey, categoryConfig } from "@/components/BottomNavigation";
import TagsMenu from "@/components/TagsMenu";
import SuggestedGroups from "@/components/SuggestedGroups";

const CATEGORY_COLORS = {
  business: {
    primary: "blue-500",
    hover: "blue-600",
    text: "text-blue-500",
    bg: "bg-blue-500",
    border: "border-blue-500/40",
    shadow: "shadow-blue-500/25",
    gradient: "from-blue-500 to-blue-600",
    mesh: "bg-mesh-business"
  },
  friendships: {
    primary: "emerald-500",
    hover: "emerald-600",
    text: "text-emerald-500",
    bg: "bg-emerald-500",
    border: "border-emerald-500/40",
    shadow: "shadow-emerald-500/25",
    gradient: "from-emerald-500 to-emerald-600",
    mesh: "bg-mesh-friends"
  },
  dating: {
    primary: "rose-500",
    hover: "rose-600",
    text: "text-rose-500",
    bg: "bg-rose-500",
    border: "border-rose-500/40",
    shadow: "shadow-rose-500/25",
    gradient: "from-rose-500 to-rose-600",
    mesh: "bg-mesh-dating"
  },
  other: {
    primary: "slate-500",
    hover: "slate-600",
    text: "text-slate-500",
    bg: "bg-slate-500",
    border: "border-slate-500/40",
    shadow: "shadow-slate-500/25",
    gradient: "from-slate-500 to-slate-600",
    mesh: "bg-slate-950"
  }
};

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
  const [modeCategory, setModeCategory] = useState<CategoryKey>(() => 
    (localStorage.getItem("f2f_activeCategory") as CategoryKey) || "dating"
  );
  const [activeCategory, setActiveCategory] = useState<{title: string, groups: any[]} | null>(null);

  // Sync with global category change
  useEffect(() => {
    const handleCatChange = (e: any) => {
      if (e.detail?.category) {
        setModeCategory(e.detail.category);
      }
    };
    window.addEventListener('f2f:categoryChange', handleCatChange as any);
    return () => window.removeEventListener('f2f:categoryChange', handleCatChange as any);
  }, []);

  const theme = CATEGORY_COLORS[modeCategory === 'friends' ? 'friendships' : (modeCategory as keyof typeof CATEGORY_COLORS) || 'other'];

  // Sync sub-menu position to localStorage
  useEffect(() => {
    localStorage.setItem("f2f_explore_primaryMode", primaryMode);
    localStorage.setItem("f2f_explore_groupTab", groupTab);
    localStorage.setItem("f2f_explore_listTab", listTab);
  }, [primaryMode, groupTab, listTab]);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);
  
  // Create Group Modal State
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [groupPhotos, setGroupPhotos] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "public" as "public" | "private",
    maxMembers: "50",
    tags: "",
    coverImage: "",
    overlayText: "",
    overlayColor: "#ffffff",
    overlayPosition: "center" as "top" | "center" | "bottom",
    overlaySize: "24"
  });

  const handleGroupPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 400, maxH = 300;
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
          setGroupPhotos(prev => [...prev, canvas.toDataURL('image/jpeg', 0.7)]);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        const maxW = 1200, maxH = 400;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setNewGroup(prev => ({...prev, coverImage: canvas.toDataURL("image/jpeg", 0.85)}));
        }
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast({ title: "Name required", description: "Please enter a group name.", variant: "destructive" });
      return;
    }
    // Add to local groups list for now
    const newGroupEntry = {
      name: newGroup.name,
      members: 1,
      distance: "0 mi",
      seed: `f2f_new_${Date.now()}`
    };
    if (newGroup.type === "public") {
      publicGroups.unshift(newGroupEntry);
    } else {
      privateGroups.unshift(newGroupEntry);
    }
    toast({ title: "Group Created! 🎉", description: `"${newGroup.name}" is now live. Share it with friends!` });
    setCreateGroupOpen(false);
    setNewGroup({ name: "", description: "", type: "public", maxMembers: "50", tags: "", coverImage: "", overlayText: "", overlayColor: "#ffffff", overlayPosition: "center", overlaySize: "24" });
    setGroupPhotos([]);
  };

  // Settings States
  const [listDistance, setListDistance] = useState("25");
  const [distanceUnit, setDistanceUnit] = useState<"mi" | "km">("mi");
  const [listSex, setListSex] = useState<"male" | "female" | "custom">("male");
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
          <div className={`w-full h-[64px] flex items-center px-4 border-b border-slate-800/80 bg-slate-900/40 sticky top-0 z-20 backdrop-blur-xl transition-colors duration-500`}>
             <button onClick={() => setActiveCategory(null)} className="mr-3 p-1 rounded-full hover:bg-slate-800/50 transition-colors">
               <ArrowLeft className={`w-6 h-6 text-slate-300 hover:${theme.text} transition-colors`} />
             </button>
             <h2 className={`text-[20px] font-bold ${theme.text} tracking-tight`}>{activeCategory.title}</h2>
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
                      ? `bg-slate-800 ${theme.text} border border-slate-700/50 hover:bg-slate-700` 
                      : `${theme.bg} text-white hover:opacity-90`
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

    return (
      <div {...groupsScroll} onScroll={groupsScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 relative pb-20">
        <div className="pt-8 pb-8">
          <div className="px-4 mb-4 flex gap-3 z-10 h-[52px]">
            <div className="w-[55%]">
              <button 
                onClick={() => setCreateGroupOpen(true)}
                className={`w-full h-full bg-gradient-to-b ${theme.gradient} text-white font-extrabold px-4 rounded-2xl text-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center border ${theme.border} hover:scale-[1.02] active:scale-95 transition-transform`}
              >
                {modeCategory === 'business' ? 'Post opening' : modeCategory === 'friends' ? 'Start group' : 'Create dating group'}
              </button>
            </div>
            
            <div className={`flex-1 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] flex items-center overflow-hidden focus-within:ring-1 ring-${theme.primary} transition-shadow`}>
              <div className="pl-3 pr-2 flex items-center justify-center h-full">
                <Search className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
              </div>
              
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent text-[13px] text-white placeholder:text-slate-500 h-full w-full outline-none truncate pr-3" 
              />
            </div>
          </div>
          
          <TagsMenu 
            tags={['hiking', 'denver', 'tech', 'coffee', 'music', 'art', 'fitness', 'reading']} 
            activeTag={null} 
            onTagSelect={(t) => console.log(t)} 
            theme={theme}
          />
          
          <SuggestedGroups title="Public" groups={publicGroups} theme={theme} onSeeAll={(title, groups) => setActiveCategory({ title, groups })} />
          <SuggestedGroups title="Private" groups={privateGroups} theme={theme} onSeeAll={(title, groups) => setActiveCategory({ title, groups })} />
          <SuggestedGroups title="21+" groups={adultGroups} theme={theme} onSeeAll={(title, groups) => setActiveCategory({ title, groups })} />
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
              className={`bg-transparent w-8 text-center outline-none text-white font-medium focus:ring-1 ring-${theme.primary} rounded px-1`}
            />
            <span className="text-slate-500 text-sm ml-1 mr-4">]</span>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
              <button onClick={() => setGroupDistanceUnit("mi")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${groupDistanceUnit === 'mi' ? theme.text : 'text-slate-500'}`}>MI</button>
              <span className="text-slate-600 text-[10px]">|</span>
              <button onClick={() => setGroupDistanceUnit("km")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${groupDistanceUnit === 'km' ? theme.text : 'text-slate-500'}`}>KM</button>
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
      id: 801, username: "shay", firstName: "shay", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 27, city: "Denver (Jefferson co.)", quote: '"lover girl and caring"', seed: "p1", bio: "lover girl and caring", interests: "Concerts, Food", profilePhoto: "https://picsum.photos/seed/p1/200/200"
    },
    { 
      id: 802, username: "aly", firstName: "Aly", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 30, city: "Byers", quote: '"Hello 😊"', seed: "p2", bio: "Hello 😊", interests: "Travel", profilePhoto: "https://picsum.photos/seed/p2/200/200"
    },
    { 
      id: 803, username: "kyniah", firstName: "kyniah", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 29, city: "Denver", quote: '"iykYK it\'s Simple 😌"', seed: "p3", bio: "iykYK it's Simple 😌", interests: "Hiking", profilePhoto: "https://picsum.photos/seed/p3/200/200"
    },
    { 
      id: 804, username: "kia", firstName: "kia", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 22, city: "Colorado Springs", quote: '"Here for vibes, laughs, and snack..."', seed: "p4", bio: "Here for vibes, laughs, and snacks", interests: "Movies", profilePhoto: "https://picsum.photos/seed/p4/200/200"
    },
    { 
      id: 805, username: "aaliyah", firstName: "aaliyah", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 24, city: "Denver", quote: '"i\'m wood smoker and i like to ba..."', seed: "p5", bio: "i'm wood smoker and i like to bake", interests: "Cooking", profilePhoto: "https://picsum.photos/seed/p5/200/200"
    },
    { 
      id: 806, username: "kaylin", firstName: "Kaylin", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 29, city: "Castle Rock", quote: '"Sarcasm, kindness, good vibes"', seed: "p6", bio: "Sarcasm, kindness, good vibes", interests: "Comedy", profilePhoto: "https://picsum.photos/seed/p6/200/200"
    },
    { 
      id: 807, username: "ladii", firstName: "ladii", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 28, city: "Aurora", quote: '"All about money it\'s all about me"', seed: "p7", bio: "All about money it's all about me", interests: "Business", profilePhoto: "https://picsum.photos/seed/p7/200/200"
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
                <img src={p.profilePhoto} alt={p.category === 'business' ? (p.company || p.firstName) : p.firstName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              </div>
              
              <div className="flex flex-col flex-1 pl-4 pr-3 overflow-hidden">
                <h3 className="text-white text-[19px] font-semibold tracking-tight leading-snug">
                  {p.category === 'business' ? (p.company || p.firstName) : p.firstName}
                </h3>
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
                  className={`px-2.5 py-1 w-16 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 ${theme.text} hover:opacity-80 font-bold text-[10px] tracking-wider transition-transform active:scale-95`}
                >
                   BUMP
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setLocation("/"); }}
                  className={`px-2.5 py-1 w-16 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 ${theme.text} hover:opacity-80 font-bold text-[10px] tracking-wider transition-transform active:scale-95`}
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
              <p className={`font-semibold text-[14px] leading-snug mt-1 truncate flex items-center ${theme.text}`}>
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
              <button onClick={() => setDistanceUnit("mi")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'mi' ? theme.text : 'text-slate-500'}`}>MI</button>
              <span className="text-slate-600 text-[10px]">|</span>
              <button onClick={() => setDistanceUnit("km")} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'km' ? theme.text : 'text-slate-500'}`}>KM</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">sex</span>
          <div className="flex items-center space-x-4">
             <button onClick={() => setListSex("male")} className={`text-sm lowercase font-medium transition-colors ${listSex === 'male' ? theme.text : 'text-slate-600'}`}>male</button>
             <button onClick={() => setListSex("female")} className={`text-sm lowercase font-medium transition-colors ${listSex === 'female' ? theme.text : 'text-slate-600'}`}>female</button>
             <button onClick={() => setListSex("custom")} className={`text-sm lowercase font-medium transition-colors ${listSex === 'custom' ? theme.text : 'text-slate-600'}`}>custom</button>
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
    <PageTransition className={`h-screen w-full page-dark relative overflow-hidden transition-all duration-700 ${theme.mesh}`}>
      {/* ═══════ Primary Header: Groups / List view ═══════ */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="w-full h-[64px] flex items-center justify-center">
          <button 
            onClick={() => { setPrimaryMode("groups"); setGroupTab("feed"); setActiveCategory(null); }}
            className="px-2 relative group pb-1 mr-3"
          >
            <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "groups" ? theme.text : "text-slate-500"}`}>Groups</span>
            {primaryMode === "groups" && (
              <div className={`absolute -bottom-1 left-0 right-0 h-[2px] ${theme.bg} rounded-full translate-y-1 mx-2 shadow-[0_0_8px_${theme.primary}]`} />
            )}
          </button>
          <span className="text-slate-600 font-light text-[22px]">/</span>
          <button 
            onClick={() => { setPrimaryMode("list"); setActiveCategory(null); }}
            className="px-2 relative group pb-1 ml-3"
          >
            <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "list" ? theme.text : "text-slate-500"}`}>List view</span>
            {primaryMode === "list" && (
              <div className={`absolute -bottom-1 left-0 right-0 h-[2px] ${theme.bg} rounded-full translate-y-1 mx-2 shadow-[0_0_8px_${theme.primary}]`} />
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
              <span className={`text-sm font-semibold tracking-wide ${groupTab === "settings" ? theme.text : "text-slate-500"}`}>Settings</span>
              {groupTab === "settings" && <div className={`absolute bottom-0 left-6 right-6 h-[2px] ${theme.bg} rounded-t-full shadow-[0_0_8px_rgba(0,0,0,0.6)]`} />}
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
              <span className={`text-sm font-semibold tracking-wide ${listTab === "feed" ? theme.text : "text-slate-500"}`}>
                {modeCategory === 'business' ? 'Professionals' : modeCategory === 'friends' ? 'Local people' : 'Explore List'}
              </span>
              {listTab === "feed" && <div className={`absolute bottom-0 left-6 right-6 h-[2px] ${theme.bg} rounded-t-full`} />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setListTab("dates")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "dates" ? theme.text : "text-slate-500"}`}>
                {modeCategory === 'business' ? 'Meetings' : 'Matches'}
              </span>
              {listTab === "dates" && <div className={`absolute bottom-0 left-6 right-6 h-[2px] ${theme.bg} rounded-t-full`} />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setListTab("settings")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "settings" ? theme.text : "text-slate-500"}`}>Settings</span>
              {listTab === "settings" && <div className={`absolute bottom-0 left-6 right-6 h-[2px] ${theme.bg} rounded-t-full`} />}
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

      {/* ═══════ Create Group Modal — Business Profile Layout ═══════ */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="sm:max-w-lg p-0 bg-slate-950 border-slate-800 max-h-[90vh] overflow-hidden flex flex-col gap-0">
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">

            {/* ── Layer 1: Cover Photo + Draggable Tagline ── */}
            <div className="relative border-b border-slate-700/50 overflow-hidden">
              {/* Cover Image */}
              <div className="absolute inset-0">
                {newGroup.coverImage ? (
                  <img src={newGroup.coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${
                    modeCategory === 'dating' ? 'from-pink-600/30 via-rose-900/30 to-slate-950' :
                    modeCategory === 'business' ? 'from-blue-600/30 via-blue-900/30 to-slate-950' :
                    'from-emerald-600/30 via-emerald-900/30 to-slate-950'
                  }`} />
                )}
                <div className="absolute inset-0 bg-slate-950/60" />
              </div>
              {/* Upload Button */}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all z-10"
              >
                <Camera className="w-4 h-4" />
              </button>
              {/* Draggable Tagline Box */}
              <div className="relative z-[5] min-h-[190px] overflow-hidden">
                {newGroup.coverImage ? (
                  <div
                    tabIndex={-1}
                    className="absolute group outline-none"
                    style={{
                      left: `${newGroup.overlayPosition === 'center' ? 50 : newGroup.overlayPosition === 'top' ? 50 : 50}%`,
                      top: `${newGroup.overlayPosition === 'top' ? 25 : newGroup.overlayPosition === 'bottom' ? 75 : 50}%`,
                      transform: 'translate(-50%, -50%)',
                      maxWidth: '95%',
                    }}
                  >
                    {/* Drag Handle */}
                    <div
                      className="flex items-center justify-center gap-1 cursor-grab active:cursor-grabbing py-1 px-4 mx-auto w-fit rounded-t-md bg-white/10 backdrop-blur-sm select-none opacity-0 group-focus-within:opacity-100 transition-opacity"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const draggable = e.currentTarget.parentElement!;
                        const container = draggable.parentElement!;
                        const rect = container.getBoundingClientRect();
                        const onMove = (ev: MouseEvent) => {
                          const x = Math.max(15, Math.min(85, ((ev.clientX - rect.left) / rect.width) * 100));
                          const y = Math.max(5, Math.min(95, ((ev.clientY - rect.top) / rect.height) * 100));
                          draggable.style.left = `${x}%`;
                          draggable.style.top = `${y}%`;
                        };
                        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                      }}
                      onTouchStart={(e) => {
                        const draggable = e.currentTarget.parentElement!;
                        const container = draggable.parentElement!;
                        const rect = container.getBoundingClientRect();
                        const onMove = (ev: TouchEvent) => {
                          ev.preventDefault();
                          const t = ev.touches[0];
                          const x = Math.max(15, Math.min(85, ((t.clientX - rect.left) / rect.width) * 100));
                          const y = Math.max(5, Math.min(95, ((t.clientY - rect.top) / rect.height) * 100));
                          draggable.style.left = `${x}%`;
                          draggable.style.top = `${y}%`;
                        };
                        const onUp = () => { document.removeEventListener('touchmove', onMove as any); document.removeEventListener('touchend', onUp); };
                        document.addEventListener('touchmove', onMove as any, { passive: false });
                        document.addEventListener('touchend', onUp);
                      }}
                    >
                      <span className="text-white/50 text-[8px] font-bold tracking-widest uppercase">⠿ drag</span>
                    </div>
                    {/* Tagline + Controls */}
                    <div
                      className="rounded-b-md rounded-tr-md p-2"
                      data-group-slogan="true"
                      style={{
                        backgroundColor: `rgba(0,0,0,${Number(newGroup.overlaySize) > 0 ? 0.2 : 0})`,
                        backdropFilter: `blur(4px)`,
                      }}
                    >
                      <textarea
                        value={newGroup.overlayText}
                        onChange={(e) => setNewGroup({...newGroup, overlayText: e.target.value})}
                        maxLength={100}
                        style={{ color: newGroup.overlayColor, resize: 'both', overflow: 'auto' }}
                        className="text-sm font-bold italic drop-shadow-md bg-transparent border-0 outline-none text-center placeholder:text-blue-300/40 appearance-none shadow-none min-w-[180px] max-w-[400px] block"
                        placeholder="Your group tagline..."
                        rows={2}
                      />
                      {/* Controls row - visible on focus */}
                      <div className="hidden group-focus-within:flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                        <input
                          type="color"
                          value={newGroup.overlayColor}
                          onChange={(e) => setNewGroup({...newGroup, overlayColor: e.target.value})}
                          className="w-5 h-5 rounded-full border border-white/20 cursor-pointer shrink-0"
                          style={{ WebkitAppearance: 'none', padding: 0 } as any}
                        />
                        <span className="text-white/40 text-[9px] shrink-0">BLUR</span>
                        <input
                          type="range" min="0" max="20" step="1" defaultValue="4"
                          onChange={(e) => {
                            const val = e.target.value;
                            const box = e.target.closest('[data-group-slogan]') as HTMLElement;
                            if (box) {
                              box.style.backdropFilter = `blur(${val}px)`;
                              box.style.backgroundColor = Number(val) > 0 ? 'rgba(0,0,0,0.2)' : 'transparent';
                            }
                          }}
                          className="flex-1 h-1 accent-blue-400 cursor-pointer"
                        />
                        <span className="text-white/40 text-[9px] shrink-0">SIZE</span>
                        <select
                          value={newGroup.overlaySize}
                          onChange={(e) => setNewGroup({...newGroup, overlaySize: e.target.value})}
                          className="bg-transparent border border-white/20 text-white text-[9px] rounded px-1 py-0.5 outline-none"
                        >
                          <option value="12" className="bg-slate-900">S</option>
                          <option value="14" className="bg-slate-900">M</option>
                          <option value="18" className="bg-slate-900">L</option>
                          <option value="24" className="bg-slate-900">XL</option>
                          <option value="32" className="bg-slate-900">2XL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors z-[5]"
                  >
                    <ImagePlus className="w-8 h-8 text-slate-500" />
                    <span className="text-slate-500 text-sm font-medium">Tap to add cover photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Layer 2: Group Details ── */}
            <div className={`px-8 py-6 border-b ${modeCategory === 'dating' ? 'border-pink-500/10' : modeCategory === 'business' ? 'border-blue-500/10' : 'border-emerald-500/10'}`}>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-2 ${
                modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {modeCategory === 'business' ? 'Opening Details' : modeCategory === 'friends' ? 'Group Details' : 'Dating Group Details'}
              </h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>Group Name</span>
                  <Input 
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder={modeCategory === 'dating' ? 'e.g. Friday Night Mixers' : modeCategory === 'business' ? 'e.g. Denver Tech Meetup' : 'e.g. Hiking Crew'}
                    className={`bg-slate-950/50 text-white text-sm font-bold h-10 rounded-lg placeholder:text-slate-600 ${
                      modeCategory === 'dating' ? 'border-pink-500/20' : modeCategory === 'business' ? 'border-blue-500/20' : 'border-emerald-500/20'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>Description</span>
                  <textarea 
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="What's this group about?"
                    className={`w-full text-lg text-slate-200 font-bold bg-transparent border rounded-lg p-3 outline-none transition-colors resize-none min-h-[50px] placeholder:text-slate-500 ${
                      modeCategory === 'dating' ? 'border-pink-500/20 focus:border-pink-500/40' : modeCategory === 'business' ? 'border-blue-500/20 focus:border-blue-500/40' : 'border-emerald-500/20 focus:border-emerald-500/40'
                    }`}
                    rows={2}
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            {/* ── Layer 3: Group Photos Gallery ── */}
            <div className={`px-8 py-6 border-b ${modeCategory === 'dating' ? 'border-pink-500/10' : modeCategory === 'business' ? 'border-blue-500/10' : 'border-emerald-500/10'}`}>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-2 ${
                modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
              }`}>Group Photos</h4>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {groupPhotos.map((photo, i) => (
                  <div key={i} className="relative min-w-[100px] h-[80px] rounded-lg overflow-hidden group/photo shrink-0">
                    <img src={photo} alt={`Group ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGroupPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/photo:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className={`min-w-[100px] h-[80px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shrink-0 ${
                  modeCategory === 'dating' ? 'border-pink-500/30 hover:border-pink-400/50 bg-pink-950/20' : modeCategory === 'business' ? 'border-blue-500/30 hover:border-blue-400/50 bg-blue-950/20' : 'border-emerald-500/30 hover:border-emerald-400/50 bg-emerald-950/20'
                }`}>
                  <Camera className={`w-5 h-5 ${modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'}`}>Add Photos</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleGroupPhotosUpload} />
                </label>
              </div>
            </div>

            {/* ── Layer 4: Group Settings ── */}
            <div className={`px-8 py-6 border-b ${modeCategory === 'dating' ? 'border-pink-500/10' : modeCategory === 'business' ? 'border-blue-500/10' : 'border-emerald-500/10'}`}>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-2 ${
                modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
              }`}>Settings</h4>
              
              {/* Group Type Toggle */}
              <div className="mb-5">
                <span className={`text-xs font-black uppercase tracking-widest block mb-2 ${
                  modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
                }`}>Group Type</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewGroup({...newGroup, type: "public"})}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer rounded-md ${
                      newGroup.type === "public" 
                        ? `${modeCategory === 'dating' ? 'bg-pink-500/20 text-pink-400 border-pink-500' : modeCategory === 'business' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500'} hover:opacity-80` 
                        : 'bg-transparent text-slate-500 border-slate-700 hover:bg-slate-800'
                    }`}>
                    [ Public ]
                  </button>
                  <button
                    onClick={() => setNewGroup({...newGroup, type: "private"})}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer rounded-md ${
                      newGroup.type === "private" 
                        ? `${modeCategory === 'dating' ? 'bg-pink-500/20 text-pink-400 border-pink-500' : modeCategory === 'business' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500'} hover:opacity-80` 
                        : 'bg-transparent text-slate-500 border-slate-700 hover:bg-slate-800'
                    }`}>
                    [ Private ]
                  </button>
                </div>
              </div>

              {/* Max Members & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>Max Members</span>
                  <Input 
                    type="number"
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup({...newGroup, maxMembers: e.target.value})}
                    className={`bg-slate-950/50 text-white text-sm font-bold h-9 rounded-lg placeholder:text-slate-600 ${
                      modeCategory === 'dating' ? 'border-pink-500/20' : modeCategory === 'business' ? 'border-blue-500/20' : 'border-emerald-500/20'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>Tags</span>
                  <Input 
                    value={newGroup.tags}
                    onChange={(e) => setNewGroup({...newGroup, tags: e.target.value})}
                    placeholder="coffee, dating"
                    className={`bg-slate-950/50 text-white text-sm font-bold h-9 rounded-lg placeholder:text-slate-600 ${
                      modeCategory === 'dating' ? 'border-pink-500/20' : modeCategory === 'business' ? 'border-blue-500/20' : 'border-emerald-500/20'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── Sticky Footer ── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md shrink-0">
            <Button variant="ghost" onClick={() => setCreateGroupOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleCreateGroup} className={`bg-gradient-to-r ${theme.gradient} text-white font-black uppercase tracking-widest text-[11px] px-6`}>
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
