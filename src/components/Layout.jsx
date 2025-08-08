import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import FooterGaceta from "./FooterGaceta";

export default function Layout() {
    return (
        <>
            <NavBar />
            <main className="flex-1 flex flex-col gap-40 min-h-screen">
                <Outlet />
            </main>
            <FooterGaceta />
        </>
    )
}