import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import ProfileCard from "@/components/ProfileCard";
import Map from "@/components/Map";
import { ChevronDown, ChevronLeft, ChevronRight, Search, Heart, ArrowLeft, Plus, ImagePlus, Camera, X, MapPin, Tag, Hash } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


type PrimaryMode = "groups" | "list";
type GroupSubTab = "feed" | "list" | "settings";
type ListSubTab = "feed" | "settings";

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
    type: "public" as "public" | "private" | "21+",
    maxMembers: "50",
    tags: "",
    groupLeader: "",
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
    } else if (newGroup.type === "21+") {
      adultGroups.unshift(newGroupEntry);
    } else {
      privateGroups.unshift(newGroupEntry);
    }
    toast({ title: "Group Created! 🎉", description: `"${newGroup.name}" is now live. Share it with friends!` });
    setCreateGroupOpen(false);
    setNewGroup({ name: "", description: "", type: "public", maxMembers: "50", tags: "", groupLeader: "", coverImage: "", overlayText: "", overlayColor: "#ffffff", overlayPosition: "center", overlaySize: "24" });
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
  const [tagCloudOpen, setTagCloudOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('f2f_selectedTags') || '[]'); } catch { return []; }
  });
  const [newTagInput, setNewTagInput] = useState("");
  const [customTags, setCustomTags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('f2f_customTags') || '[]'); } catch { return []; }
  });
  const [activeLetter, setActiveLetter] = useState("A");
  const alphabetRef = useRef<HTMLDivElement>(null);

  // Persist custom tags and selected tags
  useEffect(() => { localStorage.setItem('f2f_customTags', JSON.stringify(customTags)); }, [customTags]);
  useEffect(() => { localStorage.setItem('f2f_selectedTags', JSON.stringify(selectedTags)); }, [selectedTags]);

  const MASTER_TAGS = [
    // Popular (will also appear at top)
    'hiking', 'fitness', 'coffee', 'music', 'tech', 'art', 'reading', 'travel',
    'foodie', 'gaming', 'photography', 'yoga', 'running', 'dancing', 'cooking',
    // A
    'adventure', 'anime', 'archery', 'astrology',
    // B
    'basketball', 'biking', 'board games', 'book club', 'bowling', 'brunch',
    // C
    'camping', 'cars', 'chess', 'climbing', 'comedy', 'concerts', 'crafts', 'cycling',
    // D
    'denver', 'diy', 'dogs', 'drawing',
    // E
    'entrepreneur', 'esports', 'exploring',
    // F
    'fashion', 'film', 'fishing', 'football',
    // G
    'gardening', 'golf', 'guitar',
    // H
    'happy hour', 'hunting',
    // I-J
    'investing', 'jazz',
    // K
    'karaoke', 'kayaking', 'kickboxing',
    // L
    'languages', 'lgbtq+', 'live music',
    // M
    'martial arts', 'meditation', 'movies', 'motorcycles',
    // N
    'nature', 'networking', 'nightlife',
    // O
    'outdoors', 'off-road',
    // P
    'painting', 'pets', 'pickleball', 'poetry', 'potluck', 'puzzles',
    // R
    'real estate', 'rock climbing', 'roller skating',
    // S
    'sailing', 'salsa', 'singing', 'skateboarding', 'skiing', 'snowboarding', 'soccer', 'spirituality', 'surfing', 'swimming',
    // T
    'tennis', 'theater', 'thrifting', 'trivia',
    // V-W
    'veganism', 'vinyl', 'volleyball', 'volunteering', 'wine', 'writing', 'woodworking',
    // X-Z
    'xbox', 'zumba'
  ];

  const POPULAR_TAGS = MASTER_TAGS.slice(0, 15);
  const allTags = [...new Set([...MASTER_TAGS, ...customTags])].sort();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !allTags.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
      setSelectedTags(prev => [...prev, tag]);
      setActiveLetter(tag[0].toUpperCase());
      toast({ title: "Tag created! 🏷️", description: `#${tag} added — showing under "${tag[0].toUpperCase()}".` });
    } else if (allTags.includes(tag)) {
      if (!selectedTags.includes(tag)) toggleTag(tag);
      setActiveLetter(tag[0].toUpperCase());
      toast({ title: "Tag selected", description: `#${tag} is now active.` });
    }
    setNewTagInput("");
  };

  // Sync selected tags to listTags search
  useEffect(() => {
    setListTags(selectedTags.join(', '));
  }, [selectedTags]);

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
        <div className="pt-2 pb-4">
          {/* ── Distance Radius Indicator ── */}
          <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
              <span className="text-[12px] text-slate-400 font-medium">Groups within</span>
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  value={groupDistance}
                  onChange={(e) => setGroupDistance(e.target.value)}
                  className={`bg-slate-800/80 border border-slate-700/50 rounded-md w-10 text-center text-[13px] font-bold text-white py-0.5 outline-none focus:ring-1 ring-${theme.primary} transition-shadow`}
                />
                <div className="flex items-center bg-slate-800/60 rounded-md border border-slate-700/40 overflow-hidden">
                  <button 
                    onClick={() => { if (groupDistanceUnit === 'km') { setGroupDistance(String(Math.round(parseFloat(groupDistance) * 0.621371) || 25)); } setGroupDistanceUnit("mi"); }} 
                    className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${groupDistanceUnit === 'mi' ? `${theme.text} bg-slate-700/50` : 'text-slate-500'}`}
                  >MI</button>
                  <div className="w-px h-3 bg-slate-700/50" />
                  <button 
                    onClick={() => { if (groupDistanceUnit === 'mi') { setGroupDistance(String(Math.round(parseFloat(groupDistance) * 1.60934) || 40)); } setGroupDistanceUnit("km"); }} 
                    className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${groupDistanceUnit === 'km' ? `${theme.text} bg-slate-700/50` : 'text-slate-500'}`}
                  >KM</button>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">of your location</span>
          </div>

          <div className="px-4 mt-4 mb-4 h-[52px]">
            <button 
              onClick={() => setCreateGroupOpen(true)}
              className={`w-full h-full bg-gradient-to-b ${theme.gradient} text-white font-extrabold px-4 rounded-2xl text-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center border ${theme.border} hover:scale-[1.02] active:scale-95 transition-transform`}
            >
              {modeCategory === 'business' ? 'Post opening' : modeCategory === 'friends' ? 'Start group' : 'Create dating group'}
            </button>
          </div>
          
          <div className={`mx-4 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] flex items-center overflow-hidden focus-within:ring-1 ring-${theme.primary} transition-shadow h-[44px]`}>
            <div className="pl-3.5 pr-2 flex items-center justify-center h-full">
              <Search className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder="Search groups... e.g. Dance, Hiking, Yoga, Fishing" 
              className="bg-transparent text-[13px] text-white placeholder:text-slate-500 h-full w-full outline-none truncate pr-3" 
            />
          </div>
          
          <SuggestedGroups title="Public" groups={publicGroups} theme={theme} onSeeAll={(title, groups) => setActiveCategory({ title, groups })} />
          <SuggestedGroups title="Private" groups={privateGroups} theme={theme} onSeeAll={(title, groups) => setActiveCategory({ title, groups })} />
          <SuggestedGroups title="21+" groups={adultGroups} theme={theme} onSeeAll={(title, groups) => setActiveCategory({ title, groups })} />
        </div>
      </div>
    );
  };

  const renderGroupList = () => renderGroupFeed();

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
              <button onClick={() => { if (groupDistanceUnit === 'km') { setGroupDistance(String(Math.round(parseFloat(groupDistance) * 0.621371) || 25)); } setGroupDistanceUnit("mi"); }} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${groupDistanceUnit === 'mi' ? theme.text : 'text-slate-500'}`}>MI</button>
              <span className="text-slate-600 text-[10px]">|</span>
              <button onClick={() => { if (groupDistanceUnit === 'mi') { setGroupDistance(String(Math.round(parseFloat(groupDistance) * 1.60934) || 40)); } setGroupDistanceUnit("km"); }} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${groupDistanceUnit === 'km' ? theme.text : 'text-slate-500'}`}>KM</button>
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
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setTagCloudOpen(true)}
               className={`flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/60 transition-colors ${theme.text}`}
             >
               <Tag className="w-3 h-3" />
               <span className="text-[10px] font-bold tracking-wider uppercase">Tags</span>
             </button>
             <span className="text-slate-500 text-sm">[</span>
             <input 
               type="text" 
               placeholder="Search"
               value={groupTags}
               onChange={(e) => setGroupTags(e.target.value)}
               className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
             />
             <span className="text-slate-500 text-sm">]</span>
          </div>
        </div>
      </div>
    </div>
  );

  const mockListProfiles = [
    { 
      id: 803, username: "kyniah", firstName: "kyniah", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 29, city: "Denver", distance: 0.3, quote: '"iykYK it\'s Simple 😌"', seed: "p3", bio: "iykYK it's Simple 😌", interests: "Hiking", profilePhoto: "https://picsum.photos/seed/p3/200/200"
    },
    { 
      id: 805, username: "aaliyah", firstName: "aaliyah", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 24, city: "Denver", distance: 0.7, quote: '"i\'m wood smoker and i like to ba..."', seed: "p5", bio: "i'm wood smoker and i like to bake", interests: "Cooking", profilePhoto: "https://picsum.photos/seed/p5/200/200"
    },
    { 
      id: 801, username: "shay", firstName: "shay", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 27, city: "Denver (Jefferson co.)", distance: 1.2, quote: '"lover girl and caring"', seed: "p1", bio: "lover girl and caring", interests: "Concerts, Food", profilePhoto: "https://picsum.photos/seed/p1/200/200"
    },
    { 
      id: 807, username: "ladii", firstName: "ladii", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 28, city: "Aurora", distance: 3.4, quote: '"All about money it\'s all about me"', seed: "p7", bio: "All about money it's all about me", interests: "Business", profilePhoto: "https://picsum.photos/seed/p7/200/200"
    },
    { 
      id: 806, username: "kaylin", firstName: "Kaylin", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 29, city: "Castle Rock", distance: 8.5, quote: '"Sarcasm, kindness, good vibes"', seed: "p6", bio: "Sarcasm, kindness, good vibes", interests: "Comedy", profilePhoto: "https://picsum.photos/seed/p6/200/200"
    },
    { 
      id: 802, username: "aly", firstName: "Aly", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 30, city: "Byers", distance: 14.2, quote: '"Hello 😊"', seed: "p2", bio: "Hello 😊", interests: "Travel", profilePhoto: "https://picsum.photos/seed/p2/200/200"
    },
    { 
      id: 804, username: "kia", firstName: "kia", lastName: "", category: "dating", sex: "female", isActive: true,
      age: 22, city: "Colorado Springs", distance: 22.1, quote: '"Here for vibes, laughs, and snack..."', seed: "p4", bio: "Here for vibes, laughs, and snacks", interests: "Movies", profilePhoto: "https://picsum.photos/seed/p4/200/200"
    },
  ];

  const renderListView = () => {
    return (
      <div {...listScroll} onScroll={listScroll.onScroll} className="flex-1 overflow-y-auto w-full h-full text-slate-300 pb-20">
        {/* ── Distance Radius Indicator ── */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
            <span className="text-[12px] text-slate-400 font-medium">Within</span>
            <div className="flex items-center gap-1">
              <input 
                type="text" 
                value={listDistance}
                onChange={(e) => setListDistance(e.target.value)}
                className={`bg-slate-800/80 border border-slate-700/50 rounded-md w-10 text-center text-[13px] font-bold text-white py-0.5 outline-none focus:ring-1 ring-${theme.primary} transition-shadow`}
              />
              <div className="flex items-center bg-slate-800/60 rounded-md border border-slate-700/40 overflow-hidden">
                <button 
                  onClick={() => { if (distanceUnit === 'km') { setListDistance(String(Math.round(parseFloat(listDistance) * 0.621371) || 25)); } setDistanceUnit("mi"); }} 
                  className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${distanceUnit === 'mi' ? `${theme.text} bg-slate-700/50` : 'text-slate-500'}`}
                >MI</button>
                <div className="w-px h-3 bg-slate-700/50" />
                <button 
                  onClick={() => { if (distanceUnit === 'mi') { setListDistance(String(Math.round(parseFloat(listDistance) * 1.60934) || 40)); } setDistanceUnit("km"); }} 
                  className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${distanceUnit === 'km' ? `${theme.text} bg-slate-700/50` : 'text-slate-500'}`}
                >KM</button>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">of your location</span>
        </div>
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
                  {p.age}, {p.city} • <span className={theme.text}>{distanceUnit === 'km' ? (p.distance * 1.60934).toFixed(1) : p.distance} {distanceUnit}</span> away
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
              <button onClick={() => { if (distanceUnit === 'km') { setListDistance(String(Math.round(parseFloat(listDistance) * 0.621371) || 25)); } setDistanceUnit("mi"); }} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'mi' ? theme.text : 'text-slate-500'}`}>MI</button>
              <span className="text-slate-600 text-[10px]">|</span>
              <button onClick={() => { if (distanceUnit === 'mi') { setListDistance(String(Math.round(parseFloat(listDistance) * 1.60934) || 40)); } setDistanceUnit("km"); }} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'km' ? theme.text : 'text-slate-500'}`}>KM</button>
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

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <span className="lowercase font-bold tracking-wide">tags</span>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setTagCloudOpen(true)}
               className={`flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/60 transition-colors ${theme.text}`}
             >
               <Tag className="w-3 h-3" />
               <span className="text-[10px] font-bold tracking-wider uppercase">Tags</span>
             </button>
             <span className="text-slate-500 text-sm">[</span>
             <input 
               type="text" 
               placeholder="Search"
               value={listTags}
               onChange={(e) => setListTags(e.target.value)}
               className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
             />
             <span className="text-slate-500 text-sm">]</span>
          </div>
        </div>

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-700/50">
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${theme.bg} text-white hover:opacity-80 transition-opacity active:scale-95`}
                >
                  #{tag}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}


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
                    Object.keys(options).forEach(key => {
                      if (key.startsWith('show')) options[key] = false;
                    });
                  } catch (e) {}
                }
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
              onClick={() => setGroupTab("list")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${groupTab === "list" ? theme.text : "text-slate-500"}`}>Groups view</span>
              {groupTab === "list" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${theme.bg} rounded-t-full`} />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setGroupTab("settings")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${groupTab === "settings" ? theme.text : "text-slate-500"}`}>Settings</span>
              {groupTab === "settings" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${theme.bg} rounded-t-full`} />}
            </button>
          </div>
        )}

        {/* ═══════ Sub-tabs (Only visible in List Mode) ═══════ */}
        {primaryMode === "list" && (
          <div className="w-full flex border-t border-slate-800/50 h-[44px]">
            <button 
              onClick={() => setLocation("/")}
              className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/30 cursor-pointer"
            >
              <span className="text-sm font-semibold tracking-wide text-slate-500 group-hover:text-white transition-colors">View map</span>
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setListTab("feed")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "feed" ? theme.text : "text-slate-500"}`}>
                {modeCategory === 'business' ? 'Professionals' : modeCategory === 'friends' ? 'Local people' : 'View List'}
              </span>
              {listTab === "feed" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${theme.bg} rounded-t-full`} />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setListTab("settings")}
              className="flex-1 flex items-center justify-center relative transition-colors"
            >
              <span className={`text-sm font-semibold tracking-wide ${listTab === "settings" ? theme.text : "text-slate-500"}`}>Settings</span>
              {listTab === "settings" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${theme.bg} rounded-t-full`} />}
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
          groupTab === "feed" ? renderGroupFeed() : groupTab === "list" ? renderGroupList() : renderGroupSettings()
        ) : (
          listTab === "feed" ? renderListView() : renderListSettings()
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

      {/* ═══════ Tags Modal ═══════ */}
      {tagCloudOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
            <div className="flex items-center gap-2">
              <Tag className={`w-5 h-5 ${theme.text}`} />
              <h2 className="text-white text-xl font-extrabold tracking-tight">Tags</h2>
            </div>
            <button 
              onClick={() => setTagCloudOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Selected Tags Bar */}
          {selectedTags.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-800/40 bg-slate-900/50">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Active Filters ({selectedTags.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold ${theme.bg} text-white hover:opacity-80 transition-all active:scale-95`}
                  >
                    #{tag}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-24">
            {/* Popular Section */}
            <div className="px-5 pt-5 pb-4">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="text-amber-400">★</span> Popular
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3.5 py-2 rounded-full text-[14px] font-semibold border transition-all active:scale-95 ${
                      selectedTags.includes(tag) 
                        ? `${theme.bg} text-white border-transparent shadow-lg` 
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Alphabet Bar ── */}
            <div className="px-3 pt-3 pb-2 border-t border-slate-800/40">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3 px-2">Browse A — Z</p>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { if (alphabetRef.current) alphabetRef.current.scrollBy({ left: -120, behavior: 'smooth' }); }}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <div ref={alphabetRef} className="flex-1 overflow-x-auto scrollbar-hide flex gap-0.5 scroll-smooth">
                  {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => {
                    const hasItems = allTags.some(t => t[0].toUpperCase() === letter);
                    return (
                      <button
                        key={letter}
                        onClick={() => hasItems && setActiveLetter(letter)}
                        className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[15px] font-bold transition-all ${
                          activeLetter === letter
                            ? `${theme.bg} text-white shadow-lg`
                            : hasItems 
                              ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                              : 'text-slate-700 cursor-default'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => { if (alphabetRef.current) alphabetRef.current.scrollBy({ left: 120, behavior: 'smooth' }); }}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* ── Tags for Active Letter ── */}
            <div className="px-5 pt-4 pb-6">
              <p className={`text-[18px] font-extrabold uppercase tracking-wider mb-4 ${theme.text}`}>{activeLetter}</p>
              <div className="flex flex-wrap gap-2">
                {allTags.filter(t => t[0].toUpperCase() === activeLetter).length > 0 ? (
                  allTags.filter(t => t[0].toUpperCase() === activeLetter).map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-2 rounded-full text-[14px] font-medium border transition-all active:scale-95 ${
                        selectedTags.includes(tag) 
                          ? `${theme.bg} text-white border-transparent shadow-lg` 
                          : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))
                ) : (
                  <p className="text-slate-600 text-sm italic">No tags starting with {activeLetter}</p>
                )}
              </div>
            </div>
          </div>

          {/* Create Tag Bar — Fixed Bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60 px-5 py-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
            <div className="flex items-center gap-2">
              <Hash className={`w-4 h-4 ${theme.text} shrink-0`} />
              <input
                type="text"
                placeholder="Create a new tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-opacity-50"
              />
              <button 
                onClick={handleCreateTag}
                disabled={!newTagInput.trim()}
                className={`px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider ${theme.bg} text-white disabled:opacity-30 hover:opacity-90 transition-all active:scale-95`}
              >
                Add
              </button>
            </div>
          </div>
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
                <div className="space-y-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    modeCategory === 'dating' ? 'text-pink-400' : modeCategory === 'business' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>Group Leader / Contact</span>
                  <Input 
                    value={newGroup.groupLeader}
                    onChange={(e) => setNewGroup({...newGroup, groupLeader: e.target.value})}
                    placeholder="e.g. Your name or username"
                    className={`bg-slate-950/50 text-white text-sm font-bold h-10 rounded-lg placeholder:text-slate-600 ${
                      modeCategory === 'dating' ? 'border-pink-500/20' : modeCategory === 'business' ? 'border-blue-500/20' : 'border-emerald-500/20'
                    }`}
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
                  <button
                    onClick={() => setNewGroup({...newGroup, type: "21+"})}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer rounded-md ${
                      newGroup.type === "21+" 
                        ? `${modeCategory === 'dating' ? 'bg-pink-500/20 text-pink-400 border-pink-500' : modeCategory === 'business' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500'} hover:opacity-80` 
                        : 'bg-transparent text-slate-500 border-slate-700 hover:bg-slate-800'
                    }`}>
                    [ 21+ ]
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
