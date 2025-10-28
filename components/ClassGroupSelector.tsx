import React from 'react';
import { ClassGroup } from '../types';
import Card from './common/Card';

interface ClassGroupSelectorProps {
  classGroups: { group: ClassGroup; description: string }[];
  onSelect: (group: ClassGroup) => void;
}

const icons: Record<ClassGroup, React.ReactNode> = {
    [ClassGroup.CHILDREN]: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1a1 1 0 01-1-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v6a1 1 0 001 1h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1a1 1 0 01-1-1V5a1 1 0 011-1h7v-.5z" /></svg>,
    [ClassGroup.YOUTH]: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 4a1 1 0 11-2 0 1 1 0 012 0zM12.293 7.293a1 1 0 011.414 0L15 8.586l-1.293-1.293a1 1 0 010-1.414zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
    [ClassGroup.GRADUATES]: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>,
    [ClassGroup.MATURE]: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>,
    [ClassGroup.PERSPECTIVE]: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>,
    [ClassGroup.ELDERLY]: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a1 1 0 000 2h1v1a1 1 0 001 1h2a1 1 0 001-1V6h1a1 1 0 100-2h-1V3a1 1 0 00-1-1H6zM4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
};

const ClassGroupSelector: React.FC<ClassGroupSelectorProps> = ({ classGroups, onSelect }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold text-brand-dark mb-4">老師，歡迎您！</h2>
      <p className="text-lg text-gray-600 mb-12">請選擇您的班級群組以開始。</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classGroups.map(({ group, description }) => (
          <Card key={group} onClick={() => onSelect(group)} className="text-center group">
            <div className="p-6 bg-brand-light group-hover:bg-brand-accent transition-colors duration-300">
                <div className="text-brand-primary group-hover:text-white transition-colors duration-300 mx-auto w-fit">
                    {icons[group]}
                </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-brand-dark">{group}</h3>
              <p className="text-gray-500 mt-2">{description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassGroupSelector;