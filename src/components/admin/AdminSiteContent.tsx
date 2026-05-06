import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DonationGoal {
  id: string;
  title: string;
  target_amount: number;
  currency: string;
  is_active: boolean;
}

const AdminSiteContent = () => {
  const [goals, setGoals] = useState<DonationGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    target_amount: "",
    currency: "KES",
  });

  const fetchGoals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("donation_goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load goals");
    } else {
      setGoals(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.target_amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("donation_goals").insert({
      title: newGoal.title,
      target_amount: parseFloat(newGoal.target_amount),
      currency: newGoal.currency,
      is_active: true,
    });

    if (error) {
      toast.error("Failed to add goal");
    } else {
      toast.success("Goal added");
      setNewGoal({ title: "", target_amount: "", currency: "KES" });
      fetchGoals();
    }
    setIsSaving(false);
  };

  const toggleGoalActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("donation_goals")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update goal");
    } else {
      fetchGoals();
    }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("donation_goals").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete goal");
    } else {
      toast.success("Goal deleted");
      fetchGoals();
    }
  };

  return (
    <div className="space-y-6">
      {/* Donation Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Donation Goals</CardTitle>
          <CardDescription>
            Set campaign fundraising targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-border rounded-lg">
            <div className="space-y-2">
              <Label>Goal Title</Label>
              <Input
                value={newGoal.title}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Campaign Fund 2027"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input
                type="number"
                value={newGoal.target_amount}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, target_amount: e.target.value }))}
                placeholder="10000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={newGoal.currency}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, currency: e.target.value }))}
                placeholder="KES"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddGoal} disabled={isSaving} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </div>

          {/* Existing Goals */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No donation goals set
            </p>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Target: {goal.currency} {goal.target_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={goal.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleGoalActive(goal.id, goal.is_active)}
                    >
                      {goal.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSiteContent;
