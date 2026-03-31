export default function ClusterList({ clusters }) {
  return (
    <div className="card">
      <h2>Saved Question Clusters</h2>

      {clusters.length === 0 ? (
        <p>No clusters yet.</p>
      ) : (
        <div className="stack">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="cluster-item">
              <h3>{cluster.canonicalQuestion}</h3>
              <p><strong>Answer:</strong> {cluster.approvedAnswer}</p>
              <p><strong>Tone:</strong> {cluster.toneTag}</p>
              <p><strong>Auto-play:</strong> {cluster.autoPlay ? "On" : "Off"}</p>
              <p>
                <strong>Phrasings:</strong>{" "}
                {cluster.samplePhrasings.length > 0
                  ? cluster.samplePhrasings.join(" | ")
                  : "None"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}