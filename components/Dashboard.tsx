import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassGroup, QuarterlyPlan } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Card from './common/Card';
import Button from './common/Button';

interface DashboardProps {
  selectedGroup: ClassGroup;
  onNavigateToBuilder: (planId: string | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedGroup, onNavigateToBuilder }) => {
  const { t } = useTranslation('dashboard');
  const [plans, setPlans] = useLocalStorage<QuarterlyPlan[]>('quarterlyPlans', []);

  const handleDelete = (planId: string) => {
    if (window.confirm(t('teacherSupport.confirmDelete'))) {
      setPlans(plans.filter(p => p.id !== planId));
    }
  };

  const filteredPlans = plans.filter(p => p.classGroup === selectedGroup);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-brand-dark"><span className="text-brand-primary">{selectedGroup}</span> {t('teacherSupport.dashboard')}</h2>
        <Button onClick={() => onNavigateToBuilder(null)}>
          {t('teacherSupport.createNewPlan')}
        </Button>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <Card key={plan.id} className="flex flex-col">
              <div className="p-6 flex-grow">
                <h3 className="text-xl font-bold text-brand-dark">{plan.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('teacherSupport.classGroup')}: {plan.classGroup}</p>
                <p className="text-sm text-gray-500 mt-1">{plan.lessons.length} {t('teacherSupport.lessons')}</p>
                <p className="text-xs text-gray-400 mt-4">{t('teacherSupport.lastUpdated')}: {new Date(plan.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => onNavigateToBuilder(plan.id)}>{t('common:buttons.edit')}</Button>
                <Button variant="danger" onClick={() => handleDelete(plan.id)}>{t('common:buttons.delete')}</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-light rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-xl font-medium text-brand-dark">{t('teacherSupport.noPlan')}</h3>
          <p className="mt-2 text-gray-500">{t('teacherSupport.noPlanDescription')}</p>
          <div className="mt-6">
            <Button onClick={() => onNavigateToBuilder(null)}>{t('teacherSupport.createNewPlan')}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;