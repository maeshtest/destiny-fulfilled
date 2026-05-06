import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import ThankYouVolunteer from "./ThankYouVolunteer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface VoterDriveSectionProps {
  showThankYou?: boolean;
}

// Kenyan Counties (All 47)
const kenyanCounties = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita/Taveta",
  "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
  "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
  "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
  "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo/Marakwet", "Nandi",
  "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho",
  "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya",
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi City"
];

// Sample constituencies by county (most common ones)
const constituenciesByCounty: Record<string, string[]> = {
  "Mombasa": ["Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita"],
  "Kwale": ["Msambweni", "Lungalunga", "Matuga", "Kinango"],
  "Kilifi": ["Kilifi North", "Kilifi South", "Kaloleni", "Rabai", "Ganze", "Malindi", "Magarini"],
  "Tana River": ["Garsen", "Galole", "Bura"],
  "Lamu": ["Lamu East", "Lamu West"],
  "Taita/Taveta": ["Taveta", "Wundanyi", "Mwatate", "Voi"],
  "Garissa": ["Garissa Township", "Balambala", "Lagdera", "Dadaab", "Fafi", "Ijara"],
  "Wajir": ["Wajir North", "Wajir East", "Tarbaj", "Wajir West", "Eldas", "Wajir South"],
  "Mandera": ["Mandera West", "Banissa", "Mandera North", "Mandera South", "Mandera East", "Lafey"],
  "Marsabit": ["Moyale", "North Horr", "Saku", "Laisamis"],
  "Isiolo": ["Isiolo North", "Isiolo South"],
  "Meru": ["Igembe South", "Igembe Central", "Igembe North", "Tigania West", "Tigania East", "North Imenti", "Buuri", "Central Imenti", "South Imenti"],
  "Tharaka-Nithi": ["Maara", "Chuka/Igambang'ombe", "Tharaka"],
  "Embu": ["Manyatta", "Runyenjes", "Mbeere North", "Mbeere South"],
  "Kitui": ["Mwingi North", "Mwingi West", "Mwingi Central", "Kitui West", "Kitui Rural", "Kitui Central", "Kitui East", "Kitui South"],
  "Machakos": ["Masinga", "Yatta", "Kangundo", "Matungulu", "Kathiani", "Mavoko", "Machakos Town", "Mwala"],
  "Makueni": ["Mbooni", "Kilome", "Kaiti", "Makueni", "Kibwezi West", "Kibwezi East"],
  "Nyandarua": ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Jorok", "Ndaragwa"],
  "Nyeri": ["Tetu", "Kieni", "Mathira", "Othaya", "Mukurweini", "Nyeri Town"],
  "Kirinyaga": ["Mwea", "Gichugu", "Ndia", "Kirinyaga Central"],
  "Murang'a": ["Kangema", "Mathioya", "Kiharu", "Kigumo", "Maragwa", "Kandara", "Gatanga"],
  "Kiambu": ["Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", "Githunguri", "Kiambaa", "Kiambu Town", "Kabete", "Kikuyu", "Limuru", "Lari"],
  "Turkana": ["Turkana North", "Turkana West", "Turkana Central", "Loima", "Turkana South", "Turkana East"],
  "West Pokot": ["Kapenguria", "Sigor", "Kacheliba", "Pokot South"],
  "Samburu": ["Samburu West", "Samburu North", "Samburu East"],
  "Trans Nzoia": ["Kwanza", "Endebess", "Saboti", "Kiminini", "Cherangany"],
  "Uasin Gishu": ["Soy", "Turbo", "Moiben", "Ainabkoi", "Kapseret", "Kesses"],
  "Elgeyo/Marakwet": ["Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South"],
  "Nandi": ["Tinderet", "Aldai", "Nandi Hills", "Chesumei", "Emgwen", "Mosop"],
  "Baringo": ["Tiaty", "Baringo North", "Baringo Central", "Baringo South", "Mogotio", "Eldama Ravine"],
  "Laikipia": ["Laikipia West", "Laikipia East", "Laikipia North"],
  "Nakuru": ["Molo", "Njoro", "Naivasha", "Gilgil", "Kuresoi South", "Kuresoi North", "Subukia", "Rongai", "Bahati", "Nakuru Town West", "Nakuru Town East"],
  "Narok": ["Kilgoris", "Emurua Dikirr", "Narok North", "Narok East", "Narok South", "Narok West"],
  "Kajiado": ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
  "Kericho": ["Kipkelion East", "Kipkelion West", "Ainamoi", "Bureti", "Belgut", "Sigowet/Soin"],
  "Bomet": ["Sotik", "Chepalungu", "Bomet East", "Bomet Central", "Konoin"],
  "Kakamega": ["Lugari", "Likuyani", "Malava", "Lurambi", "Navakholo", "Mumias West", "Mumias East", "Matungu", "Butere", "Khwisero", "Shinyalu", "Ikolomani"],
  "Vihiga": ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"],
  "Bungoma": ["Mt. Elgon", "Sirisia", "Kabuchai", "Bumula", "Kanduyi", "Webuye East", "Webuye West", "Kimilili", "Tongaren"],
  "Busia": ["Teso North", "Teso South", "Nambale", "Matayos", "Butula", "Funyula", "Budalangi"],
  "Siaya": ["Ugenya", "Ugunja", "Alego Usonga", "Gem", "Bondo", "Rarieda"],
  "Kisumu": ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
  "Homa Bay": ["Kasipul", "Kabondo Kasipul", "Karachuonyo", "Rangwe", "Homa Bay Town", "Ndhiwa", "Suba North", "Suba South"],
  "Migori": ["Rongo", "Awendo", "Suna East", "Suna West", "Uriri", "Nyatike", "Kuria East", "Kuria West"],
  "Kisii": ["Bonchari", "South Mugirango", "Bomachoge Borabu", "Bobasi", "Bomachoge Chache", "Nyaribari Masaba", "Nyaribari Chache", "Kitutu Chache North", "Kitutu Chache South"],
  "Nyamira": ["Kitutu Masaba", "West Mugirango", "North Mugirango", "Borabu"],
  "Nairobi City": ["Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", "Kamukunji", "Starehe", "Mathare"]
};

const interests = [
  "Voter registration drives",
  "Community outreach",
  "Civic education",
  "Social media campaigns",
  "Phone banking",
  "Door-to-door canvassing",
  "Event organization",
  "Data entry & administration"
];

const VoterDriveSection = ({ showThankYou = false }: VoterDriveSectionProps) => {
  const [isSubmitted, setIsSubmitted] = useState(showThankYou);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    county: "",
    constituency: "",
    interests: [] as string[],
    additionalInfo: ""
  });

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked 
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("volunteers").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        county: formData.county || null,
        constituency: formData.constituency || null,
      });

      if (error) throw error;

      toast.success("Thank you for joining the movement!");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return <ThankYouVolunteer />;
  }

  const getConstituencies = (county: string) => {
    return constituenciesByCounty[county] || [];
  };

  return (
    <section   id="join"   className="py-20 bg-gradient-to-br from-green-700 via-green-600 to-green-500 min-h-screen flex items-center justify-center" >
      <div className="container mx-auto px-4">
        <div className="w-full lg:w-4/5 mx-auto">
          {/* Header */}
          <div className="text-center mb-10 text-white">
            <span className="inline-block px-4 py-1 bg-white/20 text-white text-sm font-medium mb-4 rounded-full backdrop-blur">
              Get Involved
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-3">
              Join Voter Drive
            </h2>
            <p className="text-green-100 max-w-xl mx-auto">
              Be part of the change Kenya needs. Your voice and action can help Reset, Restore, and Rebuild our nation.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow-2xl border border-gray-100 rounded-xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  👤 Personal Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0712345678"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  📍 Location
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      County
                    </label>
                    <Select 
                      value={formData.county} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        county: value,
                        constituency: "" 
                      }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your county" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {kenyanCounties.map((county) => (
                          <SelectItem key={county} value={county}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Constituency
                    </label>
                    <Select 
                      value={formData.constituency} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, constituency: value }))}
                      disabled={!formData.county}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={formData.county ? "Select constituency" : "Select county first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {getConstituencies(formData.county).map((constituency) => (
                          <SelectItem key={constituency} value={constituency}>
                            {constituency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  🗳️ Volunteer Interests
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {interests.map((interest) => (
                    <label 
                      key={interest}
                      className="flex items-center gap-3 p-3 border border-gray-200 cursor-pointer hover:bg-emerald-50/50 transition-colors group"
                    >
                      <Checkbox
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                        className="border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {interest}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  💬 Additional Information
                </h4>
                <Textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Tell us about any relevant skills or experience..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Terms */}
              <div className="p-4 bg-gray-50 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox required className="mt-1" />
                  <div className="text-sm text-gray-600">
                    I agree to the terms and conditions of volunteering. I understand that my information 
                    will be used for voter mobilization purposes only.
                  </div>
                </label>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="w-full btn-voter-drive text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Join the Voter Drive 🚀"
                )}
              </Button>
            </form>

            {/* Privacy Notice */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Your information is secure and will only be used for voter mobilization purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoterDriveSection;
