import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = => {
 const [dark, setDark] = useState( => {
 if (typeof window !== "undefined") {
 return localStorage.getItem("theme") === "dark";
 }
 return false;
 });

 useEffect( => {
 document.documentElement.classList.toggle("dark", dark);
 localStorage.setItem("theme", dark ? "dark" : "light");
 }, [dark]);

 return (
 <button
 onClick={ => setDark(!dark)}
 className="p-2 text-foreground hover:text-accent transition-colors"
 aria-label="تبديل الوضع"
 >
 {dark ? <Sun size={20} /> : <Moon size={20} />}
 </button>
 );
};

export default ThemeToggle;
