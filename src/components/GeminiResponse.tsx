import React from 'react';
import ReactMarkdown from 'react-markdown';

interface GeminiResponseProps {
  responseText: string;
}

const GeminiResponse: React.FC<GeminiResponseProps> = ({ responseText }) => {
  return <ReactMarkdown>{responseText}</ReactMarkdown>;
};

export default GeminiResponse;