import { useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState<string>("");

  async function pingApi() {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/health`);
      const data = await res.json();

      if (data.ok) {
        setStatus("API OK");
      } else {
        setStatus("API returned unexpected response");
      }
    } catch (err) {
      setStatus("Failed to reach API");
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={pingApi}>
        Ping API
      </button>

      {status && <p>{status}</p>}
    </div>
  );
}
