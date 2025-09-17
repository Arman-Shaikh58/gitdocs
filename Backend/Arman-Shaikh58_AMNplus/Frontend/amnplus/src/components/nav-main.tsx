"use client"

import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon,
    isActive?: boolean;
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link to={item.url} key={item.title}>
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} >
                {Icon && <Icon className="h-6 w-6" />}
                <span className="text-lg font-medium">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            </Link>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
