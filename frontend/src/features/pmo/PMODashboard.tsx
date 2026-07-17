import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card } from "../../components/common/UIComponents";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, ShieldAlert, GitCommit, FileText, Loader2 } from "lucide-react";

export const PMODashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/pmo/analytics/overview/");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load PMO analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Failed to load analytics data.</div>;
  }

  const chartData = [
    { name: "Active Projects", value: data.active_projects },
    { name: "Requirements", value: data.total_requirements },
    { name: "Risks Logged", value: data.total_risks }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">PMO Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Cross-project portfolio insights and requirement traceability metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-1 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
          </div>
          <span className="text-3xl font-black text-foreground">{data.active_projects} / {data.total_projects}</span>
        </Card>

        <Card className="p-4 flex flex-col gap-1 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Requirements</span>
          </div>
          <span className="text-3xl font-black text-foreground">{data.total_requirements}</span>
        </Card>

        <Card className="p-4 flex flex-col gap-1 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Risks</span>
          </div>
          <span className="text-3xl font-black text-foreground">{data.total_risks}</span>
        </Card>

        <Card className="p-4 flex flex-col gap-1 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <GitCommit className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Integration Coverage</span>
          </div>
          <span className="text-3xl font-black text-foreground">{data.integration_coverage_percent}%</span>
        </Card>
      </div>

      <Card className="p-6 mt-4">
        <h2 className="text-lg font-bold mb-6">Portfolio Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#333", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
