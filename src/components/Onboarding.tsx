
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, BookOpen, MessageCircle, Video, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "Welcome to StudySphere",
      subtitle: "Your AI-Powered Study Companion",
      description: "Join thousands of students in collaborative learning with intelligent assistance and real-time study sessions.",
      icon: Brain,
      gradient: "from-blue-500 to-purple-600",
      features: [
        { icon: MessageCircle, text: "Smart Q&A Community" },
        { icon: Video, text: "Live Study Sessions" },
        { icon: FileText, text: "Resource Sharing" }
      ]
    },
    {
      title: "Study Together",
      subtitle: "Collaborative Learning Made Easy",
      description: "Connect with study partners, join video sessions, and solve problems together in real-time.",
      icon: Users,
      gradient: "from-green-500 to-blue-500",
      features: [
        { icon: Users, text: "Study Groups" },
        { icon: Video, text: "Video Collaboration" },
        { icon: MessageCircle, text: "Real-time Chat" }
      ]
    },
    {
      title: "AI-Powered Learning",
      subtitle: "Get Instant Help Anytime",
      description: "Our AI assistant provides personalized study help, explanations, and resources tailored to your learning style.",
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      features: [
        { icon: Brain, text: "Smart AI Tutor" },
        { icon: BookOpen, text: "Personalized Content" },
        { icon: FileText, text: "Study Resources" }
      ]
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/auth');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skip = () => {
    navigate('/auth');
  };

  const currentSlideData = slides[currentSlide];
  const IconComponent = currentSlideData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-white">
          <CardContent className="p-0">
            {/* Header with gradient background */}
            <div className={`bg-gradient-to-br ${currentSlideData.gradient} p-8 text-white text-center rounded-t-lg`}>
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconComponent className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{currentSlideData.title}</h1>
              <p className="text-blue-100 font-medium">{currentSlideData.subtitle}</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                {currentSlideData.description}
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {currentSlideData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-10 h-10 bg-gradient-to-br ${currentSlideData.gradient} rounded-lg flex items-center justify-center`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Progress Indicators */}
              <div className="flex justify-center space-x-2 mb-8">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? `bg-gradient-to-r ${currentSlideData.gradient}` 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={skip}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip
                </Button>

                <div className="flex space-x-2">
                  {currentSlide > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevSlide}
                      className="flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  
                  <Button
                    onClick={nextSlide}
                    className={`bg-gradient-to-r ${currentSlideData.gradient} hover:opacity-90 flex items-center shadow-lg`}
                  >
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Join over 10,000+ students already using StudySphere
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
