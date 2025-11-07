"use client";

import { useState } from "react";
import "./../app/app.css";
import "@aws-amplify/ui-react/styles.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "api" | "ingest" | "tools">("overview");

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          ⚔️ Rift Rewind Reviewer
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#666" }}>
          Track, Reflect, Depart - Personalized LoL Insights via AWS AI
        </p>
      </header>

      <nav style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #eee" }}>
        {["overview", "api", "ingest", "tools"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: activeTab === tab ? "#0070f3" : "transparent",
              color: activeTab === tab ? "white" : "#666",
              cursor: "pointer",
              borderRadius: "4px 4px 0 0",
              textTransform: "capitalize",
              fontWeight: activeTab === tab ? "bold" : "normal",
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div style={{ background: "#f9f9f9", padding: "2rem", borderRadius: "8px" }}>
        {activeTab === "overview" && (
          <div>
            <h2>🎮 Architecture Overview</h2>
            <p style={{ marginBottom: "1.5rem" }}>
              Rift Rewind Reviewer uses a serverless architecture to provide AI-powered League of Legends insights.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3>📦 S3 Storage</h3>
                <p>Securely stores match data with versioning and encryption enabled.</p>
              </div>

              <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3>⚡ 3 Lambda Functions</h3>
                <ul style={{ paddingLeft: "1.5rem" }}>
                  <li><strong>API</strong>: Orchestrates Bedrock Agent</li>
                  <li><strong>Ingest</strong>: Processes match data</li>
                  <li><strong>Tools</strong>: Provides data to AI</li>
                </ul>
              </div>

              <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3>🚪 API Gateway</h3>
                <p>RESTful API endpoints for all client interactions with CORS support.</p>
              </div>

              <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3>🤖 Bedrock Agent</h3>
                <p>AI orchestrator providing natural language insights about your gameplay.</p>
              </div>
            </div>

            <div style={{ marginTop: "2rem", background: "white", padding: "1.5rem", borderRadius: "8px" }}>
              <h3>📚 Documentation</h3>
              <p>For detailed architecture documentation, see <a href="https://github.com/luke-cheng/Rift-Rewind-Reviewer/blob/main/ARCHITECTURE.md" target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>ARCHITECTURE.md</a></p>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div>
            <h2>🔌 API Endpoint</h2>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <h3>GET /api</h3>
              <p>Returns API information and available endpoints.</p>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "message": "Rift Rewind Reviewer API",
  "version": "1.0.0",
  "endpoints": {
    "api": "/api - Main API endpoint",
    "ingest": "/ingest - Data ingestion endpoint",
    "tools": "/tools - Bedrock Agent tools endpoint"
  }
}`}
              </pre>
            </div>

            <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px" }}>
              <h3>POST /api</h3>
              <p>Query the Bedrock Agent for personalized insights.</p>
              <h4>Request Body:</h4>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "query": "How did I perform in my last game?",
  "sessionId": "optional-session-id"
}`}
              </pre>
              <h4>Response:</h4>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "response": "AI-generated insights...",
  "sessionId": "session-123"
}`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "ingest" && (
          <div>
            <h2>📥 Ingest Endpoint</h2>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px" }}>
              <h3>POST /ingest</h3>
              <p>Ingest League of Legends match data into S3 storage.</p>
              <h4>Request Body:</h4>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "matchId": "NA1_1234567890",
  "playerId": "player-summoner-id",
  "matchData": {
    "gameMode": "CLASSIC",
    "gameDuration": 1800,
    "champion": "Ahri",
    "kills": 5,
    "deaths": 3,
    "assists": 12,
    "win": true,
    // ... additional match data
  }
}`}
              </pre>
              <h4>Response:</h4>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "message": "Match data ingested successfully",
  "key": "match-data/player-id/match-id.json",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "tools" && (
          <div>
            <h2>🔧 Tools Endpoint</h2>
            <p style={{ marginBottom: "1.5rem" }}>
              Internal endpoint used by Bedrock Agent to retrieve player data. Supports multiple actions:
            </p>

            <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <h3>getPlayerMatches</h3>
              <p>Retrieve all matches for a player.</p>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "action": "getPlayerMatches",
  "parameters": {
    "playerId": "player-summoner-id"
  }
}`}
              </pre>
            </div>

            <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <h3>getMatchDetails</h3>
              <p>Get detailed data for a specific match.</p>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "action": "getMatchDetails",
  "parameters": {
    "playerId": "player-summoner-id",
    "matchId": "NA1_1234567890"
  }
}`}
              </pre>
            </div>

            <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px" }}>
              <h3>getPlayerStats</h3>
              <p>Calculate aggregate statistics for a player.</p>
              <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`{
  "action": "getPlayerStats",
  "parameters": {
    "playerId": "player-summoner-id"
  }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      <footer style={{ marginTop: "3rem", textAlign: "center", color: "#666" }}>
        <p>
          ✨ Built with Next.js, AWS Amplify, and AWS CDK
        </p>
        <p style={{ fontSize: "0.9rem" }}>
          Deploy with: <code style={{ background: "#f5f5f5", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>npx ampx sandbox</code>
        </p>
      </footer>
    </main>
  );
}
