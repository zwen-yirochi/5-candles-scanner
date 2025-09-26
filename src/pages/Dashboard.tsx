import React from 'react';
import ChartContainer from '../components/ChartContainer';

const Dashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-black">
            <div className="mx-auto  max-w-7xl">
                {/* 차트 영역 */}
                <ChartContainer />
            </div>
        </div>
    );
};

export default Dashboard;
