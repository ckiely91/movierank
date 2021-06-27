import { FC, memo, ReactNode } from "react";

interface INavProps {
  rightSection?: ReactNode;
}

const Nav: FC<INavProps> = ({ rightSection }) => {
  return (
    <nav className="navbar is-spaced has-shadow" role="navigation">
      <div className="container">
        <div className="navbar-brand">
          <div className="navbar-item">
            <h1 className="title">🍿 Movie Night 🍿</h1>
          </div>
        </div>
        {rightSection && <div className="navbar-end">{rightSection}</div>}
      </div>
    </nav>
  );
};

export default memo(Nav);
