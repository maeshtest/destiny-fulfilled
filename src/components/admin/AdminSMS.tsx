import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageSquare, Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AdminSMS = () => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [senderId, setSenderId] = useState("fluxsms");
  const [bulkPhones, setBulkPhones] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    const { data } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setSmsLogs(data || []);
    setIsLoadingLogs(false);
  };

  const sendSMS = async (action: "send" | "bulk") => {
    if (action === "send" && (!phone || !message)) {
      toast.error("Phone and message are required");
      return;
    }
    if (action === "bulk" && (!bulkPhones || !message)) {
      toast.error("Phone numbers and message are required");
      return;
    }

    setIsSending(true);
    try {
      const body: any = { action, message, sender_id: senderId };
      if (action === "send") body.phone = phone;
      if (action === "bulk") body.phones = bulkPhones.split(",").map((p: string) => p.trim());

      const { data, error } = await supabase.functions.invoke("pesaflux-sms", { body });
      if (error) throw error;

      toast.success(action === "send" ? "SMS sent successfully" : "Bulk SMS sent");
      fetchLogs();
      if (action === "send") setPhone("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS");
    }
    setIsSending(false);
  };

  const checkBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke("pesaflux-sms", {
        body: { action: "balance" },
      });
      if (error) throw error;
      setBalance(JSON.stringify(data, null, 2));
    } catch (err: any) {
      toast.error("Failed to check balance");
    }
    setIsLoadingBalance(false);
  };

  return (
    <Tabs defaultValue="send" className="space-y-4">
      <TabsList>
        <TabsTrigger value="send" className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          Send SMS
        </TabsTrigger>
        <TabsTrigger value="bulk" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Bulk SMS
        </TabsTrigger>
        <TabsTrigger value="balance" className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Balance
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="send">
        <Card>
          <CardHeader>
            <CardTitle>Send Single SMS</CardTitle>
            <CardDescription>Send an SMS message to a single phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="254712345678" />
            </div>
            <div className="space-y-2">
              <Label>Sender ID</Label>
              <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="fluxsms" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." rows={4} />
              <p className="text-xs text-muted-foreground">{message.length}/160 characters</p>
            </div>
            <Button onClick={() => sendSMS("send")} disabled={isSending}>
              {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send SMS
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bulk">
        <Card>
          <CardHeader>
            <CardTitle>Bulk SMS</CardTitle>
            <CardDescription>Send to multiple numbers (comma-separated)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Numbers</Label>
              <Textarea value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} placeholder="254712345678, 254798765432, ..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." rows={4} />
            </div>
            <Button onClick={() => sendSMS("bulk")} disabled={isSending}>
              {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Send Bulk SMS
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="balance">
        <Card>
          <CardHeader>
            <CardTitle>SMS Balance</CardTitle>
            <CardDescription>Check your FluxSMS account balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkBalance} disabled={isLoadingBalance}>
              {isLoadingBalance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
              Check Balance
            </Button>
            {balance && (
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{balance}</pre>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>SMS Logs</CardTitle>
              <CardDescription>Recent SMS messages sent</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.message}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "sent" ? "default" : "destructive"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {smsLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No SMS logs yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AdminSMS;
