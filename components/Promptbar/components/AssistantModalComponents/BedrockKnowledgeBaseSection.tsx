import React, { useState } from 'react';
import { BedrockKnowledgeBaseConfig } from '@/types/assistant';
import { IconChevronRight, IconChevronDown, IconInfoCircle } from '@tabler/icons-react';

interface Props {
    config: BedrockKnowledgeBaseConfig;
    onChange: (config: BedrockKnowledgeBaseConfig) => void;
    disabled?: boolean;
}

const BedrockKnowledgeBaseSection: React.FC<Props> = ({ config, onChange, disabled = false }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="mt-6 border border-neutral-500 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-[#343541]">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-black dark:text-neutral-200">
                    AWS Bedrock Knowledge Base
                </h3>
                <div className="group relative">
                    <IconInfoCircle size={16} className="text-neutral-500 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-64 p-2 bg-white dark:bg-[#40414F] border border-neutral-300 dark:border-neutral-600 rounded shadow-lg text-xs">
                        Use a Bedrock Knowledge Base for large document collections with semantic search
                    </div>
                </div>
            </div>

            {/* Toggle Switch */}
            <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                    type="checkbox"
                    checked={config.useBedrockKnowledgeBase}
                    onChange={(e) => onChange({
                        ...config,
                        useBedrockKnowledgeBase: e.target.checked
                    })}
                    disabled={disabled}
                    className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    Enable Bedrock Knowledge Base
                </span>
            </label>

            {/* KB Configuration (shown when enabled) */}
            {config.useBedrockKnowledgeBase && (
                <div className="mt-3 p-3 bg-white dark:bg-[#40414F] rounded border-l-4 border-green-500">
                    {/* KB ID - Required */}
                    <div className="mb-3">
                        <label htmlFor="kb-id" className="block mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Knowledge Base ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="kb-id"
                            type="text"
                            placeholder="e.g., ABCDEFGHIJ"
                            value={config.bedrockKnowledgeBaseId || ''}
                            onChange={(e) => onChange({
                                ...config,
                                bedrockKnowledgeBaseId: e.target.value
                            })}
                            required={config.useBedrockKnowledgeBase}
                            disabled={disabled}
                            className="w-full rounded-lg border border-neutral-500 px-3 py-2 text-sm text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#343541] dark:text-neutral-100"
                        />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            Find this in AWS Console → Bedrock → Knowledge Bases
                        </p>
                    </div>

                    {/* Advanced Settings Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        disabled={disabled}
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2"
                    >
                        {showAdvanced ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                        Advanced Settings
                    </button>

                    {showAdvanced && (
                        <div className="space-y-3 mt-3">
                            {/* Region - Optional */}
                            <div>
                                <label htmlFor="kb-region" className="block mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    AWS Region (Optional)
                                </label>
                                <select
                                    id="kb-region"
                                    value={config.bedrockKnowledgeBaseRegion || ''}
                                    onChange={(e) => onChange({
                                        ...config,
                                        bedrockKnowledgeBaseRegion: e.target.value
                                    })}
                                    disabled={disabled}
                                    className="w-full rounded-lg border border-neutral-500 px-3 py-2 text-sm text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#343541] dark:text-neutral-100"
                                >
                                    <option value="">Use deployment region</option>
                                    <option value="us-east-1">US East (N. Virginia)</option>
                                    <option value="us-west-2">US West (Oregon)</option>
                                    <option value="eu-west-1">Europe (Ireland)</option>
                                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                                    <option value="eu-central-1">Europe (Frankfurt)</option>
                                </select>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    Leave blank to use your deployment region
                                </p>
                            </div>

                            {/* Max Results - Optional */}
                            <div>
                                <label htmlFor="kb-max-results" className="block mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    Max Results
                                </label>
                                <input
                                    id="kb-max-results"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={config.bedrockKnowledgeBaseMaxResults || 10}
                                    onChange={(e) => onChange({
                                        ...config,
                                        bedrockKnowledgeBaseMaxResults: parseInt(e.target.value) || 10
                                    })}
                                    disabled={disabled}
                                    className="w-full rounded-lg border border-neutral-500 px-3 py-2 text-sm text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#343541] dark:text-neutral-100"
                                />
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    Number of contexts to retrieve (1-50, default: 10)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info Box for Hybrid Mode */}
            {config.useBedrockKnowledgeBase && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded text-xs text-blue-900 dark:text-blue-200">
                    <strong>ℹ️ Hybrid Mode:</strong> You can use both Bedrock Knowledge Base and uploaded documents together. 
                    The assistant will use information from both sources.
                </div>
            )}
        </div>
    );
};

export default BedrockKnowledgeBaseSection;
