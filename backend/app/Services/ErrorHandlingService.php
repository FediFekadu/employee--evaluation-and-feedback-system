<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Exception;
use Throwable;

/**
 * Enhanced Error Handling Service for Evaluation Submission Control
 * Provides comprehensive error handling, user-friendly messages, and retry mechanisms
 */
class ErrorHandlingService
{
    /**
     * Error type constants for categorization
     */
    const ERROR_TYPES = [
        'NETWORK' => 'network',
        'VALIDATION' => 'validation',
        'DUPLICATE_SUBMISSION' => 'duplicate_submission',
        'ACCESS_DENIED' => 'access_denied',
        'TIMEOUT' => 'timeout',
        'SERVER_ERROR' => 'server_error',
        'INSUFFICIENT_DATA' => 'insufficient_data',
        'EXPORT_FAILED' => 'export_failed',
        'EVALUATION_CLOSED' => 'evaluation_closed',
        'EVALUATION_NOT_OPEN' => 'evaluation_not_open',
        'LARGE_DATASET' => 'large_dataset'
    ];

    /**
     * User-friendly error messages
     */
    const ERROR_MESSAGES = [
        'network' => [
            'title' => '🌐 Network Connection Error',
            'message' => 'Unable to connect to the server. Please check your internet connection and try again.',
            'action' => 'Retry',
            'retryable' => true
        ],
        'validation' => [
            'title' => '📝 Validation Error',
            'message' => 'Please check your input and ensure all required fields are completed correctly.',
            'action' => 'Review Input',
            'retryable' => false
        ],
        'duplicate_submission' => [
            'title' => '⚠️ Duplicate Submission Prevented',
            'message' => 'You have already submitted this evaluation. Each student can only submit one evaluation per course-teacher combination.',
            'action' => 'View Submitted Evaluations',
            'retryable' => false
        ],
        'access_denied' => [
            'title' => '🔒 Access Denied',
            'message' => 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.',
            'action' => 'Contact Support',
            'retryable' => false
        ],
        'timeout' => [
            'title' => '⏱️ Request Timeout',
            'message' => 'The operation is taking longer than expected. This may be due to high server load or a large dataset.',
            'action' => 'Try Again',
            'retryable' => true
        ],
        'server_error' => [
            'title' => '🔧 Server Error',
            'message' => 'An unexpected error occurred on the server. Our team has been notified and is working to resolve the issue.',
            'action' => 'Try Again Later',
            'retryable' => true
        ],
        'insufficient_data' => [
            'title' => '📊 Insufficient Data',
            'message' => 'There is not enough data available to generate the requested report or analysis.',
            'action' => 'Try Different Filters',
            'retryable' => false
        ],
        'export_failed' => [
            'title' => '📄 Export Failed',
            'message' => 'Unable to generate the requested export. This may be due to large dataset size or server limitations.',
            'action' => 'Try Smaller Dataset',
            'retryable' => true
        ],
        'evaluation_closed' => [
            'title' => '🔒 Evaluation Closed',
            'message' => 'This evaluation has been closed and no longer accepts submissions.',
            'action' => 'View Other Evaluations',
            'retryable' => false
        ],
        'evaluation_not_open' => [
            'title' => '⏳ Evaluation Not Open',
            'message' => 'This evaluation is not yet open for submissions.',
            'action' => 'Check Back Later',
            'retryable' => false
        ],
        'large_dataset' => [
            'title' => '📊 Large Dataset Detected',
            'message' => 'The requested operation involves a large dataset. Performance optimizations have been applied.',
            'action' => 'Continue',
            'retryable' => false
        ]
    ];

    /**
     * Handle and format exceptions for API responses
     *
     * @param Throwable $exception
     * @param Request $request
     * @return JsonResponse
     */
    public function handleException(Throwable $exception, Request $request): JsonResponse
    {
        $errorType = $this->categorizeException($exception);
        $errorInfo = $this->getErrorInfo($errorType, $exception);
        
        // Log the error with context
        $this->logError($exception, $request, $errorType);
        
        // Determine HTTP status code
        $statusCode = $this->getHttpStatusCode($exception, $errorType);
        
        // Build response data
        $responseData = [
            'error' => $errorType,
            'message' => $errorInfo['message'],
            'title' => $errorInfo['title'],
            'action' => $errorInfo['action'],
            'retryable' => $errorInfo['retryable'],
            'timestamp' => now()->toISOString(),
            'request_id' => $request->header('X-Request-ID', uniqid())
        ];

        // Add validation errors if applicable
        if ($exception instanceof ValidationException) {
            $responseData['errors'] = $exception->errors();
        }

        // Add debug information in development
        if (config('app.debug')) {
            $responseData['debug'] = [
                'exception' => get_class($exception),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ];
        }

        return response()->json($responseData, $statusCode);
    }

    /**
     * Categorize exception into error types
     *
     * @param Throwable $exception
     * @return string
     */
    private function categorizeException(Throwable $exception): string
    {
        // Check exception message for specific patterns
        $message = strtolower($exception->getMessage());
        
        if (str_contains($message, 'duplicate submission') || 
            str_contains($message, 'already submitted') ||
            ($exception instanceof QueryException && str_contains($message, 'unique_submission'))) {
            return self::ERROR_TYPES['DUPLICATE_SUBMISSION'];
        }

        if (str_contains($message, 'evaluation closed') || 
            str_contains($message, 'no longer accepts')) {
            return self::ERROR_TYPES['EVALUATION_CLOSED'];
        }

        if (str_contains($message, 'evaluation not open') || 
            str_contains($message, 'not yet open')) {
            return self::ERROR_TYPES['EVALUATION_NOT_OPEN'];
        }

        if (str_contains($message, 'insufficient data') || 
            str_contains($message, 'not enough data')) {
            return self::ERROR_TYPES['INSUFFICIENT_DATA'];
        }

        if (str_contains($message, 'export failed') || 
            str_contains($message, 'export generation failed') ||
            str_contains($message, 'export too large')) {
            return self::ERROR_TYPES['EXPORT_FAILED'];
        }

        if (str_contains($message, 'large dataset') || 
            str_contains($message, 'dataset too large')) {
            return self::ERROR_TYPES['LARGE_DATASET'];
        }

        if (str_contains($message, 'timeout') || 
            str_contains($message, 'time limit exceeded')) {
            return self::ERROR_TYPES['TIMEOUT'];
        }

        // Categorize by exception type
        if ($exception instanceof ValidationException) {
            return self::ERROR_TYPES['VALIDATION'];
        }

        if ($exception instanceof AuthorizationException) {
            return self::ERROR_TYPES['ACCESS_DENIED'];
        }

        if ($exception instanceof NotFoundHttpException) {
            return self::ERROR_TYPES['ACCESS_DENIED'];
        }

        if ($exception instanceof QueryException) {
            // Check for specific database errors
            $errorCode = $exception->getCode();
            if (in_array($errorCode, [1062, 23000])) { // Duplicate entry
                return self::ERROR_TYPES['DUPLICATE_SUBMISSION'];
            }
            if (in_array($errorCode, [2006, 2013])) { // Connection lost
                return self::ERROR_TYPES['NETWORK'];
            }
            return self::ERROR_TYPES['SERVER_ERROR'];
        }

        if ($exception instanceof HttpException) {
            $statusCode = $exception->getStatusCode();
            switch ($statusCode) {
                case 401:
                case 403:
                    return self::ERROR_TYPES['ACCESS_DENIED'];
                case 408:
                case 504:
                    return self::ERROR_TYPES['TIMEOUT'];
                case 422:
                    return self::ERROR_TYPES['VALIDATION'];
                default:
                    return self::ERROR_TYPES['SERVER_ERROR'];
            }
        }

        // Default to server error
        return self::ERROR_TYPES['SERVER_ERROR'];
    }

    /**
     * Get error information for a specific error type
     *
     * @param string $errorType
     * @param Throwable $exception
     * @return array
     */
    private function getErrorInfo(string $errorType, Throwable $exception): array
    {
        $defaultInfo = self::ERROR_MESSAGES[$errorType] ?? self::ERROR_MESSAGES['server_error'];
        
        // Use specific exception message if it's more descriptive
        $exceptionMessage = $exception->getMessage();
        if (!empty($exceptionMessage) && 
            !str_contains(strtolower($exceptionMessage), 'database error') &&
            !str_contains(strtolower($exceptionMessage), 'unexpected error')) {
            $defaultInfo['message'] = $exceptionMessage;
        }

        return $defaultInfo;
    }

    /**
     * Determine appropriate HTTP status code
     *
     * @param Throwable $exception
     * @param string $errorType
     * @return int
     */
    private function getHttpStatusCode(Throwable $exception, string $errorType): int
    {
        if ($exception instanceof HttpException) {
            return $exception->getStatusCode();
        }

        if ($exception instanceof ValidationException) {
            return 422;
        }

        if ($exception instanceof AuthorizationException) {
            return 403;
        }

        if ($exception instanceof NotFoundHttpException) {
            return 404;
        }

        // Map error types to status codes
        $statusMap = [
            'validation' => 422,
            'duplicate_submission' => 409,
            'access_denied' => 403,
            'timeout' => 408,
            'insufficient_data' => 422,
            'export_failed' => 422,
            'evaluation_closed' => 422,
            'evaluation_not_open' => 422,
            'large_dataset' => 200, // Success with warning
            'network' => 503,
            'server_error' => 500
        ];

        return $statusMap[$errorType] ?? 500;
    }

    /**
     * Log error with comprehensive context
     *
     * @param Throwable $exception
     * @param Request $request
     * @param string $errorType
     */
    private function logError(Throwable $exception, Request $request, string $errorType): void
    {
        $context = [
            'error_type' => $errorType,
            'exception_class' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => auth()->id(),
            'request_id' => $request->header('X-Request-ID', uniqid()),
            'timestamp' => now()->toISOString()
        ];

        // Add request data for POST/PUT requests (excluding sensitive data)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            $requestData = $request->except(['password', 'password_confirmation', 'token']);
            $context['request_data'] = $requestData;
        }

        // Log at appropriate level based on error type
        $logLevel = $this->getLogLevel($errorType);
        
        \Log::log($logLevel, "API Error: {$errorType}", $context);

        // Send to external monitoring service in production
        if (app()->environment('production') && in_array($errorType, ['server_error', 'timeout'])) {
            $this->reportToMonitoringService($exception, $context);
        }
    }

    /**
     * Get appropriate log level for error type
     *
     * @param string $errorType
     * @return string
     */
    private function getLogLevel(string $errorType): string
    {
        $levelMap = [
            'validation' => 'info',
            'duplicate_submission' => 'info',
            'access_denied' => 'warning',
            'evaluation_closed' => 'info',
            'evaluation_not_open' => 'info',
            'insufficient_data' => 'info',
            'large_dataset' => 'info',
            'export_failed' => 'warning',
            'timeout' => 'warning',
            'network' => 'error',
            'server_error' => 'error'
        ];

        return $levelMap[$errorType] ?? 'error';
    }

    /**
     * Handle submission-specific errors with enhanced validation and user guidance
     *
     * @param Throwable $exception
     * @param Request $request
     * @return JsonResponse
     */
    public function handleSubmissionError(Throwable $exception, Request $request): JsonResponse
    {
        $errorType = $this->categorizeException($exception);
        $errorInfo = $this->getErrorInfo($errorType, $exception);
        
        // Enhanced submission-specific error handling
        if ($errorType === self::ERROR_TYPES['DUPLICATE_SUBMISSION']) {
            $errorInfo['message'] = 'This evaluation has already been submitted. You can only submit one evaluation per course-teacher combination.';
            $errorInfo['action'] = 'View Submitted Evaluations';
            $errorInfo['suggestions'] = [
                'Check your submitted evaluations list',
                'Contact your instructor if you believe this is an error',
                'Ensure you are submitting for the correct course'
            ];
        } elseif ($errorType === self::ERROR_TYPES['VALIDATION']) {
            $errorInfo['message'] = 'Please review your responses and ensure all required fields are completed correctly.';
            $errorInfo['action'] = 'Review Form';
            $errorInfo['suggestions'] = [
                'Check for any empty or incomplete responses',
                'Ensure all rating scales are properly selected',
                'Verify that text responses meet minimum requirements'
            ];
        } elseif ($errorType === self::ERROR_TYPES['EVALUATION_CLOSED']) {
            $errorInfo['suggestions'] = [
                'Check the evaluation deadline',
                'Contact your department administrator',
                'Look for other open evaluations'
            ];
        }
        
        $this->logError($exception, $request, $errorType);
        $statusCode = $this->getHttpStatusCode($exception, $errorType);
        
        $responseData = [
            'error' => $errorType,
            'message' => $errorInfo['message'],
            'title' => $errorInfo['title'],
            'action' => $errorInfo['action'],
            'retryable' => $errorInfo['retryable'],
            'suggestions' => $errorInfo['suggestions'] ?? [],
            'context' => 'submission',
            'timestamp' => now()->toISOString(),
            'request_id' => $request->header('X-Request-ID', uniqid())
        ];

        if ($exception instanceof ValidationException) {
            $responseData['errors'] = $exception->errors();
            $responseData['field_errors'] = $this->formatFieldErrors($exception->errors());
        }

        return response()->json($responseData, $statusCode);
    }

    /**
     * Handle report generation errors with enhanced guidance and alternatives
     *
     * @param Throwable $exception
     * @param Request $request
     * @param string $format
     * @param int $dataSize
     * @return JsonResponse
     */
    public function handleReportError(Throwable $exception, Request $request, string $format = 'unknown', int $dataSize = 0): JsonResponse
    {
        $errorType = $this->categorizeException($exception);
        $errorInfo = $this->getErrorInfo($errorType, $exception);
        
        // Enhanced report-specific error handling
        if ($errorType === self::ERROR_TYPES['EXPORT_FAILED']) {
            $errorInfo['message'] = "Failed to generate {$format} report. This may be due to large dataset size or server limitations.";
            $errorInfo['action'] = 'Try Alternative Format';
            $errorInfo['suggestions'] = [
                'Try CSV format for better performance',
                'Apply date range or department filters',
                'Export data in smaller chunks',
                'Contact support if the issue persists'
            ];
            $errorInfo['alternatives'] = [
                'csv' => 'CSV format (fastest, most reliable)',
                'json' => 'JSON format (good for data processing)',
            ];
            if ($format !== 'csv') {
                $errorInfo['alternatives']['csv_recommended'] = true;
            }
        } elseif ($errorType === self::ERROR_TYPES['TIMEOUT']) {
            $estimatedTime = $this->estimateReportTime($format, $dataSize);
            $errorInfo['message'] = "Report generation timed out after processing {$dataSize} records. Estimated time was {$estimatedTime} seconds.";
            $errorInfo['action'] = 'Reduce Dataset Size';
            $errorInfo['suggestions'] = [
                'Apply date range filters (e.g., last semester only)',
                'Filter by specific departments or courses',
                'Use CSV format for large datasets',
                'Export data in multiple smaller reports'
            ];
        } elseif ($errorType === self::ERROR_TYPES['INSUFFICIENT_DATA']) {
            $errorInfo['suggestions'] = [
                'Check if evaluations exist for the selected period',
                'Verify that submissions have been completed',
                'Try expanding the date range',
                'Contact administrator if data should be available'
            ];
        }
        
        $this->logError($exception, $request, $errorType);
        $statusCode = $this->getHttpStatusCode($exception, $errorType);
        
        $responseData = [
            'error' => $errorType,
            'message' => $errorInfo['message'],
            'title' => $errorInfo['title'],
            'action' => $errorInfo['action'],
            'retryable' => $errorInfo['retryable'],
            'suggestions' => $errorInfo['suggestions'] ?? [],
            'alternatives' => $errorInfo['alternatives'] ?? [],
            'context' => 'report_generation',
            'format' => $format,
            'data_size' => $dataSize,
            'timestamp' => now()->toISOString(),
            'request_id' => $request->header('X-Request-ID', uniqid())
        ];

        return response()->json($responseData, $statusCode);
    }

    /**
     * Format field errors for better frontend handling
     *
     * @param array $errors
     * @return array
     */
    private function formatFieldErrors(array $errors): array
    {
        $formatted = [];
        
        foreach ($errors as $field => $messages) {
            $formatted[$field] = [
                'messages' => $messages,
                'first_message' => is_array($messages) ? $messages[0] : $messages,
                'field_name' => $this->getFieldDisplayName($field)
            ];
        }
        
        return $formatted;
    }

    /**
     * Get user-friendly field display names
     *
     * @param string $field
     * @return string
     */
    private function getFieldDisplayName(string $field): string
    {
        $displayNames = [
            'evaluation_id' => 'Evaluation',
            'responses' => 'Evaluation Responses',
            'anonymous' => 'Anonymity Setting',
            'student_id' => 'Student Information',
            'teacher_id' => 'Teacher Information',
            'course_id' => 'Course Information'
        ];
        
        return $displayNames[$field] ?? ucfirst(str_replace('_', ' ', $field));
    }

    /**
     * Estimate report generation time based on format and data size
     *
     * @param string $format
     * @param int $dataSize
     * @return int
     */
    private function estimateReportTime(string $format, int $dataSize): int
    {
        $baseTime = [
            'csv' => 2,    // 2 seconds base
            'pdf' => 8,    // 8 seconds base  
            'excel' => 5,  // 5 seconds base
            'json' => 3    // 3 seconds base
        ];
        
        $formatTime = $baseTime[$format] ?? 5;
        $sizeMultiplier = max(1, floor($dataSize / 500)); // 500 records per multiplier
        
        return $formatTime * $sizeMultiplier;
    }

    /**
     * Create a standardized error response for specific scenarios
     *
     * @param string $errorType
     * @param string|null $customMessage
     * @param array $additionalData
     * @return JsonResponse
     */
    public function createErrorResponse(string $errorType, ?string $customMessage = null, array $additionalData = []): JsonResponse
    {
        $errorInfo = self::ERROR_MESSAGES[$errorType] ?? self::ERROR_MESSAGES['server_error'];
        
        $responseData = [
            'error' => $errorType,
            'message' => $customMessage ?? $errorInfo['message'],
            'title' => $errorInfo['title'],
            'action' => $errorInfo['action'],
            'retryable' => $errorInfo['retryable'],
            'timestamp' => now()->toISOString()
        ];

        // Merge additional data
        $responseData = array_merge($responseData, $additionalData);

        // Determine status code
        $statusCode = $this->getHttpStatusCode(new Exception(), $errorType);

        return response()->json($responseData, $statusCode);
    }

    /**
     * Report critical errors to external monitoring service
     *
     * @param Throwable $exception
     * @param array $context
     */
    private function reportToMonitoringService(Throwable $exception, array $context): void
    {
        try {
            // This would integrate with services like Sentry, Bugsnag, etc.
            // For now, just log to a separate channel
            \Log::channel('monitoring')->critical('Critical error reported', [
                'exception' => $exception,
                'context' => $context
            ]);
        } catch (Exception $e) {
            // Don't let monitoring failures break the application
            \Log::error('Failed to report to monitoring service', [
                'monitoring_error' => $e->getMessage(),
                'original_exception' => $exception->getMessage()
            ]);
        }
    }

    /**
     * Handle large dataset operations with enhanced graceful degradation and progress tracking
     *
     * @param int $datasetSize
     * @param int $threshold
     * @param callable $operation
     * @param callable|null $fallbackOperation
     * @param string $context
     * @return mixed
     */
    public function handleLargeDatasetWithProgress(int $datasetSize, int $threshold, callable $operation, ?callable $fallbackOperation = null, string $context = '')
    {
        if ($datasetSize <= $threshold) {
            return $operation();
        }

        // Log large dataset warning with context
        \Log::info('Large dataset operation detected', [
            'dataset_size' => $datasetSize,
            'threshold' => $threshold,
            'context' => $context,
            'has_fallback' => $fallbackOperation !== null,
            'estimated_time' => $this->estimateProcessingTime($datasetSize, $context)
        ]);

        // Provide user feedback about large dataset handling
        if ($context === 'report_generation') {
            $message = "Large dataset detected ({$datasetSize} records). Report generation may take longer than usual.";
            if ($fallbackOperation) {
                $message .= " Using optimized processing for better performance.";
            }
        } elseif ($context === 'submission_processing') {
            $message = "Processing {$datasetSize} submissions. This may take a few moments.";
        } else {
            $message = "Large dataset detected ({$datasetSize} items). Processing with performance optimizations.";
        }

        // Set processing status for frontend progress tracking
        cache()->put("large_dataset_processing_{$context}", [
            'status' => 'processing',
            'size' => $datasetSize,
            'message' => $message,
            'started_at' => now()
        ], 300); // 5 minutes

        try {
            if ($fallbackOperation) {
                $result = $fallbackOperation();
            } else {
                // Process in chunks with progress updates
                $result = $this->processInChunks($datasetSize, $operation, $context);
            }

            // Clear processing status
            cache()->forget("large_dataset_processing_{$context}");
            
            return $result;
        } catch (Exception $e) {
            // Clear processing status on error
            cache()->forget("large_dataset_processing_{$context}");
            
            throw new Exception("Large dataset processing failed: {$e->getMessage()}. Try applying filters to reduce the dataset size.");
        }
    }

    /**
     * Process large datasets in chunks with progress tracking
     *
     * @param int $totalSize
     * @param callable $operation
     * @param string $context
     * @return mixed
     */
    private function processInChunks(int $totalSize, callable $operation, string $context)
    {
        $chunkSize = $this->getOptimalChunkSize($totalSize, $context);
        $totalChunks = ceil($totalSize / $chunkSize);
        $results = [];

        for ($i = 0; $i < $totalChunks; $i++) {
            $start = $i * $chunkSize;
            $end = min($start + $chunkSize, $totalSize);
            
            // Update progress
            $progress = [
                'current_chunk' => $i + 1,
                'total_chunks' => $totalChunks,
                'percentage' => round((($i + 1) / $totalChunks) * 100),
                'processing_range' => "{$start}-{$end}",
                'updated_at' => now()
            ];
            
            cache()->put("chunk_progress_{$context}", $progress, 300);
            
            // Process chunk
            try {
                $chunkResult = $operation($start, $chunkSize);
                $results[] = $chunkResult;
            } catch (Exception $e) {
                \Log::error("Chunk processing failed", [
                    'context' => $context,
                    'chunk' => $i + 1,
                    'range' => "{$start}-{$end}",
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
        }

        // Clear progress tracking
        cache()->forget("chunk_progress_{$context}");
        
        return $this->mergeChunkResults($results, $context);
    }

    /**
     * Get optimal chunk size based on context and total size
     *
     * @param int $totalSize
     * @param string $context
     * @return int
     */
    private function getOptimalChunkSize(int $totalSize, string $context): int
    {
        $chunkSizes = [
            'report_generation' => 500,
            'submission_processing' => 100,
            'analytics_calculation' => 200,
            'export_processing' => 1000
        ];
        
        $baseChunkSize = $chunkSizes[$context] ?? 250;
        
        // Adjust chunk size based on total size
        if ($totalSize > 10000) {
            return $baseChunkSize * 2; // Larger chunks for very large datasets
        } elseif ($totalSize < 1000) {
            return min($baseChunkSize, $totalSize); // Smaller chunks for smaller datasets
        }
        
        return $baseChunkSize;
    }

    /**
     * Merge results from chunk processing
     *
     * @param array $results
     * @param string $context
     * @return mixed
     */
    private function mergeChunkResults(array $results, string $context)
    {
        if (empty($results)) {
            return null;
        }

        // Context-specific result merging
        switch ($context) {
            case 'report_generation':
                // Merge report data arrays
                return array_merge(...$results);
                
            case 'analytics_calculation':
                // Merge analytics with proper aggregation
                return $this->aggregateAnalyticsResults($results);
                
            case 'export_processing':
                // Concatenate export data
                return implode("\n", $results);
                
            default:
                // Default array merge
                return is_array($results[0]) ? array_merge(...$results) : $results;
        }
    }

    /**
     * Aggregate analytics results from multiple chunks
     *
     * @param array $results
     * @return array
     */
    private function aggregateAnalyticsResults(array $results): array
    {
        $aggregated = [
            'total_count' => 0,
            'sum_ratings' => 0,
            'response_counts' => [],
            'participation_rates' => []
        ];

        foreach ($results as $result) {
            $aggregated['total_count'] += $result['count'] ?? 0;
            $aggregated['sum_ratings'] += $result['sum_ratings'] ?? 0;
            
            if (isset($result['response_counts'])) {
                foreach ($result['response_counts'] as $key => $count) {
                    $aggregated['response_counts'][$key] = ($aggregated['response_counts'][$key] ?? 0) + $count;
                }
            }
        }

        // Calculate final averages
        if ($aggregated['total_count'] > 0) {
            $aggregated['average_rating'] = $aggregated['sum_ratings'] / $aggregated['total_count'];
        }

        return $aggregated;
    }

    /**
     * Estimate processing time for large datasets
     *
     * @param int $datasetSize
     * @param string $context
     * @return int
     */
    private function estimateProcessingTime(int $datasetSize, string $context): int
    {
        $processingRates = [
            'report_generation' => 100,    // 100 records per second
            'submission_processing' => 50, // 50 submissions per second
            'analytics_calculation' => 200, // 200 calculations per second
            'export_processing' => 500     // 500 records per second
        ];
        
        $rate = $processingRates[$context] ?? 100;
        return max(1, ceil($datasetSize / $rate));
    }

    /**
     * Validate request rate limiting and prevent abuse
     *
     * @param Request $request
     * @param string $operation
     * @param int $maxAttempts
     * @param int $decayMinutes
     * @throws Exception
     */
    public function validateRateLimit(Request $request, string $operation, int $maxAttempts = 5, int $decayMinutes = 1): void
    {
        $key = $this->getRateLimitKey($request, $operation);
        
        if (cache()->has($key)) {
            $attempts = cache()->get($key, 0);
            
            if ($attempts >= $maxAttempts) {
                \Log::warning('Rate limit exceeded', [
                    'operation' => $operation,
                    'ip' => $request->ip(),
                    'user_id' => auth()->id(),
                    'attempts' => $attempts,
                    'max_attempts' => $maxAttempts
                ]);
                
                throw new Exception("Too many {$operation} attempts. Please wait {$decayMinutes} minute(s) before trying again.");
            }
        }
        
        // Increment attempt counter
        cache()->put($key, cache()->get($key, 0) + 1, now()->addMinutes($decayMinutes));
    }

    /**
     * Generate rate limit cache key
     *
     * @param Request $request
     * @param string $operation
     * @return string
     */
    private function getRateLimitKey(Request $request, string $operation): string
    {
        $identifier = auth()->id() ?? $request->ip();
        return "rate_limit:{$operation}:{$identifier}";
    }
}