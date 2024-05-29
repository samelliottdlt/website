import BacklogTracker from "./components/Tracker";

const BacklogPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-center my-8">
        Game Backlog Tracker
      </h1>
      <BacklogTracker />
    </div>
  );
};

export default BacklogPage;
