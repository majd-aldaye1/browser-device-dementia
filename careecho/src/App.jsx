import { useEffect, useState } from "react";
import CaregiverForm from "./components/CaregiverForm";
import ClusterList from "./components/ClusterList";
import TestConsole from "./components/TestConsole";
import { seedClusters } from "./data/seedClusters";
import { loadClusters, saveClusters } from "./utils/storage";
import "./index.css";

export default function App() {
  const [clusters, setClusters] = useState(() => loadClusters(seedClusters));

  useEffect(() => {
    saveClusters(clusters);
  }, [clusters]);

  function handleAddCluster(newCluster) {
    setClusters((prev) => [newCluster, ...prev]);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>CareEcho Prototype</h1>
        <p>
          A caregiver-approved repeated-question assistant for dementia care.
        </p>
      </header>

      <main className="grid">
        <CaregiverForm onAddCluster={handleAddCluster} />
        <TestConsole clusters={clusters} />
        <ClusterList clusters={clusters} />
      </main>
    </div>
  );
}