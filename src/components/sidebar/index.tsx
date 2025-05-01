import { useState } from "react";
import BurgerButton from "../burguerButton";
import { Pages } from "../../interfaces";
import PageButton from "../pageButton";
import { useVoip } from "../../context/voipContext";

const Sidebar = ({
  children,
  routes,
}: {
  children: React.ReactNode;
  routes: Pages;
}) => {
  const sidebarState = useState(false);
  const { showVoip } = useVoip();
  const [isOpen, setIsOpen] = sidebarState;
  return (
    <div className="flex grow relative">
      <div
        className={`text-white p-4 transition-all duration-300 absolute z-10 h-min`}
      >
        <BurgerButton sidebarState={sidebarState} />
      </div>
      <div
        className={
          "p-4 pt-[47px] transform transition-transform duration-300 absolute h-full" +
          (isOpen ? "" : " -translate-x-full")
        }
      >
        <ul className="space-y-2">
          {Object.entries(routes).map(([key, route]) => {
            if (key === "voip") {
              if (!showVoip) return null;
            }
            return <PageButton key={key} route={route} name={key} setIsOpen={setIsOpen} />;
          })}
        </ul>
      </div>
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">{children}</main>
    </div>
  );
};

export default Sidebar;
