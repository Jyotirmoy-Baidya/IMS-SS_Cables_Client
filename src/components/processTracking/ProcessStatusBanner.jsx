import { AlertCircle, CheckCircle, Clock, FileText, AlertTriangle } from 'lucide-react';

const ProcessStatusBanner = ({ dependencyStatus, processName, onSubmitReport }) => {
    if (!dependencyStatus || dependencyStatus.canStart) {
        return null; // No banner needed if process can start
    }

    const getBannerConfig = () => {
        if (dependencyStatus.blockReason === 'Previous process not completed') {
            const prevProcessName = dependencyStatus.previousProcessName || 'previous process';
            const status = dependencyStatus.previousProcessStatus || 'pending';
            const progress = dependencyStatus.previousProcessProgress || 0;

            return {
                icon: Clock,
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                textColor: 'text-orange-800',
                iconColor: 'text-orange-600',
                title: `Waiting for ${prevProcessName} to Complete`,
                message: `This process cannot start until ${prevProcessName} is completed.`,
                details: [
                    `Current Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}`,
                    `Progress: ${progress}%`
                ]
            };
        }

        if (dependencyStatus.blockReason === 'Waiting for previous process report') {
            const prevProcessName = dependencyStatus.previousProcessName || 'previous process';

            return {
                icon: FileText,
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                textColor: 'text-yellow-800',
                iconColor: 'text-yellow-600',
                title: `Waiting for Report from ${prevProcessName}`,
                message: `${prevProcessName} is completed, but the process report has not been submitted yet.`,
                details: [
                    'The report must be submitted before this process can begin'
                ],
                showSubmitButton: true
            };
        }

        if (dependencyStatus.blockReason === 'Previous process tracking not initialized') {
            return {
                icon: AlertCircle,
                bgColor: 'bg-gray-50',
                borderColor: 'border-gray-200',
                textColor: 'text-gray-800',
                iconColor: 'text-gray-600',
                title: 'Process Not Started',
                message: 'Previous process has not been initialized yet.',
                details: []
            };
        }

        return null;
    };

    const config = getBannerConfig();
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-4`}>
            <div className="flex items-start gap-3">
                <Icon size={20} className={`${config.iconColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                    <h3 className={`font-bold ${config.textColor} text-sm`}>{config.title}</h3>
                    <p className={`${config.textColor} text-sm mt-1`}>{config.message}</p>
                    {config.details && config.details.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {config.details.map((detail, idx) => (
                                <li key={idx} className={`text-xs ${config.textColor} opacity-90`}>
                                    • {detail}
                                </li>
                            ))}
                        </ul>
                    )}
                    {config.showSubmitButton && onSubmitReport && (
                        <button
                            onClick={onSubmitReport}
                            className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                            Submit Report Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcessStatusBanner;
