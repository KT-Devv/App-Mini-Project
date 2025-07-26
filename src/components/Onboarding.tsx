
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, MessageCircle, Video, FileText, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "Welcome to StudySphere",
      subtitle: "Your AI-Powered Study Companion",
      description: "Join thousands of students in collaborative learning with intelligent assistance and real-time study sessions.",
      gradient: "from-blue-500 to-blue-600",
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
      gradient: "from-blue-600 to-blue-700",
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
      gradient: "from-blue-700 to-blue-800",
      features: [
        { icon: Sparkles, text: "Smart AI Tutor" },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48ZyBmaWxsPSIjMzMzIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm transition-colors duration-300">
          <CardContent className="p-0">
            {/* Header with gradient background and StudySphere logo */}
            <div className={`bg-gradient-to-br ${currentSlideData.gradient} p-8 text-white text-center rounded-t-lg relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
              </div>
              
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 logo-animate shadow-lg">
                  <img 
                    src="/uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
                    alt="StudySphere Logo" 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                </div>
                <h1 className="text-2xl font-bold mb-2 animate-fade-in">{currentSlideData.title}</h1>
                <p className="text-blue-100 font-medium animate-fade-in">{currentSlideData.subtitle}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-muted-foreground text-center mb-8 leading-relaxed animate-fade-in">
                {currentSlideData.description}
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {currentSlideData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl feature-animate transition-colors duration-300">
                    <div className={`w-10 h-10 bg-gradient-to-br ${currentSlideData.gradient} rounded-lg flex items-center justify-center transform transition-transform hover:scale-110 shadow-md`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-foreground">{feature.text}</span>
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
                        ? `bg-gradient-to-r ${currentSlideData.gradient} scale-125 shadow-sm` 
                        : 'bg-muted scale-100'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={skip}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </Button>

                <div className="flex space-x-2">
                  {currentSlide > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevSlide}
                      className="flex items-center hover:scale-105 transition-transform border-border hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  
                  <Button
                    onClick={nextSlide}
                    className={`bg-gradient-to-r ${currentSlideData.gradient} hover:opacity-90 flex items-center shadow-lg hover:scale-105 transition-all duration-200 text-white border-0`}
                  >
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-muted-foreground text-sm mt-6 animate-fade-in">
          Join over 10,000+ students already using StudySphere
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
