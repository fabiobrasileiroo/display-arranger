import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const REPO = "fabiobrasileiroo/display-arranger"
export const REPO_URL = `https://github.com/${REPO}`
