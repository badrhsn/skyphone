"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Gift, 
  Users, 
  Star, 
  Check, 
  Copy, 
  Share2, 
  Trophy,
  DollarSign,
  ArrowLeft,
  ExternalLink 
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/components/Modal";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  category: "social" | "referral" | "survey" | "app";
  icon: React.ReactNode;
}

interface ReferralStat {
  totalReferrals: number;
  totalEarned: number;
  pendingReferrals: number;
}

export default function EarnCreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showSuccess, ModalComponent } = useModal();
  const [referralCode, setReferralCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStat>({
    totalReferrals: 0,
    totalEarned: 0,
    pendingReferrals: 0
  });
  const [userBalance, setUserBalance] = useState(0);

  const tasks: Task[] = [
    {
      id: "1",
      title: "Refer a Friend",
      description: "Invite friends and earn $2 for each successful signup",
      reward: 2.00,
      completed: false,
      category: "referral",
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "2",
      title: "Follow us on Twitter",
      description: "Follow @YadaPhone on Twitter and get instant credits",
      reward: 0.50,
      completed: false,
      category: "social",
      icon: <Share2 className="h-6 w-6" />
    },
    {
      id: "3",
      title: "Leave a Review",
      description: "Rate our app on the App Store or Google Play",
      reward: 1.00,
      completed: false,
      category: "app",
      icon: <Star className="h-6 w-6" />
    },
    {
      id: "4",
      title: "Complete Survey",
      description: "Help us improve by completing a quick survey",
      reward: 0.75,
      completed: false,
      category: "survey",
      icon: <Gift className="h-6 w-6" />
    },
    {
      id: "5",
      title: "Share on Facebook",
      description: "Share YadaPhone with your Facebook friends",
      reward: 0.50,
      completed: false,
      category: "social",
      icon: <Share2 className="h-6 w-6" />
    }
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user?.email) {
      generateReferralCode();
      fetchUserBalance();
      fetchReferralStats();
    }
  }, [status, session, router]);

  const generateReferralCode = () => {
    if (session?.user?.email) {
      // Generate a simple referral code based on user email
      const code = session.user.email.split("@")[0].toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      setReferralCode(code);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setUserBalance(userData.balance);
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  const fetchReferralStats = async () => {
    // Mock data - in real implementation, this would fetch from API
    setReferralStats({
      totalReferrals: 3,
      totalEarned: 6.00,
      pendingReferrals: 1
    });
  };

  const copyReferralCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(`YadaPhone - Get free credits with code: ${referralCode}. Sign up at https://yadaphone.com/signup?ref=${referralCode}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const shareReferralLink = () => {
    const shareData = {
      title: "Join YadaPhone and Get Free Credits!",
      text: `I'm using YadaPhone for cheap international calls. Use my referral code ${referralCode} to get free credits when you sign up!`,
      url: `https://yadaphone.com/signup?ref=${referralCode}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      copyReferralCode();
    }
  };

  const completeTask = async (taskId: string) => {
    // Mock task completion - in real implementation, this would call API
    showSuccess("Task Completed!", "Credits will be added to your account within 24 hours.");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Earn Free Credits</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Your Balance</p>
            <p className="text-2xl font-bold text-green-600">${userBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Referral Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Referral Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-8 w-8" />
                <h2 className="text-2xl font-bold">Refer Friends</h2>
              </div>
              <p className="text-blue-100 mb-6">
                Invite your friends and earn $2 for each successful signup. Your friends get $1 bonus too!
              </p>
              
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm mb-4">
                <p className="text-sm text-blue-100 mb-2">Your Referral Code</p>
                <div className="flex items-center space-x-3">
                  <code className="bg-white/30 px-3 py-2 rounded font-mono text-lg font-bold flex-1">
                    {referralCode}
                  </code>
                  <button
                    onClick={copyReferralCode}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded transition-colors"
                  >
                    {copiedCode ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={shareReferralLink}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full"
              >
                Share Referral Link
              </button>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Tasks to Earn Credits</h2>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-blue-600">
                        {task.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${task.reward.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">reward</p>
                      </div>
                      {task.completed ? (
                        <div className="text-green-600">
                          <Check className="h-6 w-6" />
                        </div>
                      ) : (
                        <button
                          onClick={() => completeTask(task.id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Referral Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-900">Your Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Referrals</span>
                  <span className="font-bold text-gray-900">{referralStats.totalReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earned</span>
                  <span className="font-bold text-green-600">${referralStats.totalEarned.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-bold text-orange-600">{referralStats.pendingReferrals}</span>
                </div>
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Referrers</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-sm">1</span>
                    </div>
                    <span className="text-sm font-medium">Alex M.</span>
                  </div>
                  <span className="text-sm text-gray-600">47 referrals</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-sm">2</span>
                    </div>
                    <span className="text-sm font-medium">Sarah K.</span>
                  </div>
                  <span className="text-sm text-gray-600">32 referrals</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">3</span>
                    </div>
                    <span className="text-sm font-medium">John D.</span>
                  </div>
                  <span className="text-sm text-gray-600">28 referrals</span>
                </div>
              </div>
            </div>

            {/* Bonus Info */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3">Bonus Opportunities</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Monthly bonus for top 10 referrers</p>
                <p>• Extra credits for social media shares</p>
                <p>• Special rewards for app reviews</p>
                <p>• Seasonal bonus campaigns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {ModalComponent}
    </div>
  );
}


