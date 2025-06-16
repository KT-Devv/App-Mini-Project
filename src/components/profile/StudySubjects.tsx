
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from 'lucide-react';

interface StudySubjectsProps {
  subjects: string[];
}

const StudySubjects = ({ subjects }: StudySubjectsProps) => {
  if (subjects.length === 0) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="flex items-center text-lg font-bold text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          Study Subjects
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors duration-200 rounded-lg px-3 py-1"
            >
              {subject}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudySubjects;
