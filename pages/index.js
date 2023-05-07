import useAuth from "../useAuth";
import Link from "next/link";

export default function Home() {
  const user = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded">
          Log in to continue
        </Link>
      </div>
    );
  }

  const apps = [
    { name: "App 1", link: "/app1", icon: "icon-url-1" },
    { name: "App 2", link: "/app2", icon: "icon-url-2" },
    // Add more apps here
  ];

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {apps.map((app, index) => (
        <Link key={index} href={app.link} className="flex flex-col items-center p-4 bg-white rounded shadow cursor-pointer">
          <img src={app.icon} alt={app.name} className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-semibold">{app.name}</h3>
        </Link>
      ))}
    </div>
  );
}
