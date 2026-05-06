import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

interface PendingDonation {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  amount: number;
  currency: string;
  verification_type: string | null;
  transaction_code: string | null;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

const AdminDonationVerification = () => {
  const [donations, setDonations] = useState<PendingDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<PendingDonation | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .in("status", ["pending_verification", "pending"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDonations(data as PendingDonation[]);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleVerify = async (id: string, approve: boolean) => {
    setIsProcessing(true);
    const { error } = await supabase
      .from("donations")
      .update({
        status: approve ? "completed" : "rejected",
        verified_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update donation");
    } else {
      toast.success(approve ? "Donation approved!" : "Donation rejected");
      setSelectedDonation(null);
      setAdminNotes("");
      fetchPending();
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pending Verifications ({donations.length})</h3>
        <Button variant="outline" size="sm" onClick={fetchPending}>Refresh</Button>
      </div>

      {donations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-primary/30" />
            No pending verifications
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((d) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium">{d.name || "Anonymous"}</p>
                    <p className="text-sm text-muted-foreground">{d.phone || d.email || "No contact"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{d.currency} {d.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(d.created_at).toLocaleDateString()}
                      </Badge>
                      {d.verification_type && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {d.verification_type.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {d.transaction_code && (
                  <p className="text-sm mt-2 font-mono bg-secondary px-2 py-1 rounded">
                    TX: {d.transaction_code}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedDonation(d); setAdminNotes(d.admin_notes || ""); }}>
                    <Eye className="w-4 h-4 mr-1" /> Review
                  </Button>
                  <Button size="sm" className="bg-primary" onClick={() => handleVerify(d.id, true)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVerify(d.id, false)}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Donation</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <strong>{selectedDonation.name || "N/A"}</strong></div>
                <div><span className="text-muted-foreground">Amount:</span> <strong>{selectedDonation.currency} {selectedDonation.amount.toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">Phone:</span> <strong>{selectedDonation.phone || "N/A"}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> <strong>{selectedDonation.email || "N/A"}</strong></div>
                {selectedDonation.transaction_code && (
                  <div className="col-span-2"><span className="text-muted-foreground">TX Code:</span> <strong className="font-mono">{selectedDonation.transaction_code}</strong></div>
                )}
              </div>

              {selectedDonation.screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Screenshot:</p>
                  <img src={selectedDonation.screenshot_url} alt="Payment proof" className="w-full rounded-lg border" />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this verification..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" disabled={isProcessing} onClick={() => selectedDonation && handleVerify(selectedDonation.id, false)}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Reject
            </Button>
            <Button disabled={isProcessing} onClick={() => selectedDonation && handleVerify(selectedDonation.id, true)}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDonationVerification;
