import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ title, children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F5F7]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
