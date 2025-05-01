import { useNavigate, useLocation } from "react-router-dom";
import { Page } from "../../interfaces";
import { Suspense } from "react";

const PageButton = ({ route, name, setIsOpen }: { route: Page; name: string, setIsOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = name === "home" ? "/" : `/${name}`

  const className = [
    "w-5 h-5 rounded focus:outline-none",
    location.pathname === path ? "text-green-800" : "cursor-pointer text-gray-500 hover:text-green-800"
  ].join(" ")

  const handleClick = () => {
    if (location.pathname !== path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  return (
    <li>
      <button
        id="page-button"
        className={className}
        onClick={handleClick}
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen">
              Loading...
            </div>
          }
        >
          {route["icon"]}
        </Suspense>
      </button>
    </li>
  );
};

export default PageButton;
