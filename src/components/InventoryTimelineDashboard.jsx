"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Package,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";

// -------------------- Utility Logic --------------------
const calculateHealthScore = (item) => {
    const totalIn = item.events
        .filter((e) => e.qty > 0)
        .reduce((s, e) => s + e.qty, 0);

    const totalOut = Math.abs(
        item.events.filter((e) => e.qty < 0).reduce((s, e) => s + e.qty, 0)
    );

    const damage = Math.abs(
        item.events
            .filter((e) => e.type.includes("Damaged"))
            .reduce((s, e) => s + e.qty, 0)
    );

    let score = 100;
    if (totalOut < totalIn * 0.3) score -= 30;
    if (damage > totalIn * 0.05) score -= 20;
    if (item.stock > totalIn * 0.6) score -= 25;

    return Math.max(score, 0);
};

const healthLabel = (score) => {
    if (score >= 70) return { label: "Healthy", color: "text-green-600" };
    if (score >= 40) return { label: "At Risk", color: "text-yellow-600" };
    return { label: "Dead Stock", color: "text-red-600" };
};

const API_BASE = "https://assignment-1-backend-42ph.onrender.com/api";

export default function InventoryTimelineDashboard() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/inventory`)
            .then((res) => res.json())
            .then((data) => {
                setInventory(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-8">Loading inventory...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6">
                Inventory Intelligence Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* SKU LIST */}
                <div className="space-y-4">
                    {inventory.map((item) => {
                        const score = calculateHealthScore(item);
                        const status = healthLabel(score);

                        return (
                            <Card
                                key={item.sku}
                                className="cursor-pointer hover:shadow-lg"
                                onClick={() => setSelectedItem(item)}
                            >
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-gray-500">{item.sku}</p>
                                        </div>
                                        <p className="font-bold">{item.stock}</p>
                                    </div>

                                    <p className={`text-sm font-semibold ${status.color}`}>
                                        Health: {status.label} ({score})
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* DETAILS PANEL */}
                <div className="md:col-span-2">
                    {selectedItem ? (
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Package /> {selectedItem.name}
                                    </h2>
                                    <Button size="sm" variant="outline">
                                        <AlertTriangle className="w-4 h-4 mr-1" /> Alerts
                                    </Button>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <h3 className="font-semibold mb-2">Inventory Timeline</h3>
                                    <div className="space-y-3">
                                        {selectedItem.events.map((e, i) => (
                                            <div
                                                key={i}
                                                className="flex justify-between border-l-4 pl-4"
                                                style={{
                                                    borderColor:
                                                        e.qty > 0
                                                            ? "#22c55e"
                                                            : e.type.includes("Damaged")
                                                                ? "#ef4444"
                                                                : "#3b82f6",
                                                }}
                                            >
                                                <div>
                                                    <p className="font-medium">{e.type}</p>
                                                    <p className="text-sm text-gray-500">{e.date}</p>
                                                </div>
                                                <p
                                                    className={`font-bold ${e.qty > 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                        }`}
                                                >
                                                    {e.qty > 0 ? "+" : ""}
                                                    {e.qty}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={selectedItem.events}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="qty" />
                                        </LineChart>
                                    </ResponsiveContainer>

                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={selectedItem.events}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="qty" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Insights */}
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <h3 className="font-semibold mb-2">SKU Insight</h3>
                                    {calculateHealthScore(selectedItem) < 40 ? (
                                        <p className="text-red-600 flex items-center gap-2">
                                            <TrendingDown /> This SKU is likely becoming dead stock.
                                        </p>
                                    ) : (
                                        <p className="text-green-600 flex items-center gap-2">
                                            <TrendingUp /> This SKU is moving at a healthy pace.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-gray-500 text-center mt-20">
                            Select a SKU to view intelligence
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
