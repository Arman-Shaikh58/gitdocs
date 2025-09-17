import * as React from "react";
import { LockKeyhole, Key, UserRoundCog, Home } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import A from "../assets/A.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { useAuth } from "./context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";

// Define user data type
type UserDataType = {
  name: string;
  email: string;
  avatar: string;
};

// Define nav item type
type NavItemType = {
  title: string;
  url: string;
  icon: any;
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const user: UserDataType = {
    name: currentUser?.displayName ?? "Guest",
    email: currentUser?.email ?? "no-email@example.com",
    avatar: currentUser?.photoURL ?? "",
  };

  const navMain: NavItemType[] = [
    {
      title: "Home",
      url: "/home",
      icon: Home,
    },
    {
      title: "Passwords",
      url: "/passwords",
      icon: LockKeyhole,
    },
    {
      title: "API Keys",
      url: "/keys",
      icon: Key,
    },
    {
      title: "Profile",
      url: "/profile/new",
      icon: UserRoundCog,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Sidebar Header */}
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={() => {
            navigate("/home");
          }}
        >
          <div className="size-10 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800">
            <img
              src={A}
              alt="AMN+ Logo"
              className="object-contain w-full h-full p-1 rounded-full h-2 w-2"
            />
          </div>
        </SidebarMenuButton>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="justify-center">
        <NavMain items={navMain} />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      {/* Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
