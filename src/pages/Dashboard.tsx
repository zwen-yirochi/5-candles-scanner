import React from 'react';
import ChartContainer from '../components/ChartContainer';

const Dashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-black">
            <div className="p-4 mx-auto max-w-7xl ">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-gray-100">5-Candles Scanner</h1>
                </div>

                {/* 차트 영역 */}
                <ChartContainer />
            </div>
        </div>
    );
};

export default Dashboard;
