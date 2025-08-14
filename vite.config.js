
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/egcrm/', // 👈 This tells Vite your site is in a subfolder
})

