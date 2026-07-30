import { Manrope, Newsreader } from "next/font/google";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
});

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
});

export const fontVariables = `${manrope.variable} ${newsreader.variable}`;
