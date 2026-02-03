pipeline {
    agent any
    
    parameters {
        choice(
            name: 'TEST_ENVIRONMENT',
            choices: ['dev', 'staging', 'production'],
            description: 'Select the environment to test'
        )
        booleanParam(
            name: 'PUBLISH_REPORT',
            defaultValue: true,
            description: 'Publish HTML report after test completion'
        )
    }
    
    environment {
        K6_VERSION = '0.47.0'
        WORKSPACE_PATH = "${WORKSPACE}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out code from repository..."
                }
                checkout scm
            }
        }
        
        stage('Install K6') {
            steps {
                script {
                    echo "Installing K6..."
                    sh '''
                        # Check if K6 is already installed
                        if ! command -v k6 &> /dev/null; then
                            echo "Installing K6..."
                            
                            # Install K6 using package manager or direct download
                            if command -v apt-get &> /dev/null; then
                                # Debian/Ubuntu
                                sudo gpg -k
                                sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
                                echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
                                sudo apt-get update
                                sudo apt-get install k6 -y
                            elif command -v yum &> /dev/null; then
                                # RedHat/CentOS
                                sudo yum install -y https://dl.k6.io/rpm/repo.rpm
                                sudo yum install k6 -y
                            else
                                # Direct download method (fallback)
                                echo "Using direct download method..."
                                wget https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz
                                tar -xzf k6-v0.47.0-linux-amd64.tar.gz
                                sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/
                                rm -rf k6-v0.47.0-linux-amd64*
                            fi
                            
                            echo "K6 installed successfully"
                        else
                            echo "K6 is already installed"
                            k6 version
                        fi
                    '''
                }
            }
        }
        
        stage('Validate Test Files') {
            steps {
                script {
                    echo "Validating test files..."
                    sh '''
                        if [ -f "Script.js" ]; then
                            echo "✓ Script.js found"
                        else
                            echo "✗ Script.js not found"
                            exit 1
                        fi
                        
                        if [ -f "options.js" ]; then
                            echo "✓ options.js found"
                        else
                            echo "✗ options.js not found"
                            exit 1
                        fi
                    '''
                }
            }
        }
        
        stage('Run K6 Performance Tests') {
            steps {
                script {
                    echo "Running K6 performance tests..."
                    sh '''
                        set -e
                        
                        echo "Starting K6 test execution..."
                        k6 run Script.js
                        
                        EXIT_CODE=$?
                        echo "K6 test completed with exit code: $EXIT_CODE"
                        
                        if [ $EXIT_CODE -ne 0 ]; then
                            echo "K6 tests failed with exit code $EXIT_CODE"
                            exit $EXIT_CODE
                        fi
                    '''
                }
            }
        }
        
        stage('Archive Test Results') {
            steps {
                script {
                    echo "Archiving test results..."
                    powershell '''
                        # Find all report HTML files
                        $reports = Get-ChildItem -Path . -Filter "report*.html"
                        
                        if ($reports.Count -gt 0) {
                            Write-Host "Found $($reports.Count) report file(s)"
                            foreach ($report in $reports) {
                                Write-Host "  - $($report.Name)"
                            }
                    sh '''
                        # Find all report HTML files
                        REPORTS=$(ls report*.html 2>/dev/null || true)
                        
                        if [ -n "$REPORTS" ]; then
                            REPORT_COUNT=$(echo "$REPORTS" | wc -l)
                            echo "Found $REPORT_COUNT report file(s)"
                            echo "$REPORTS" | while read report; do
                                echo "  - $report"
                            done
                        else
                            echo "No report files found"
                        fi
        
        stage('Publish HTML Report') {
            when {
                expression { params.PUBLISH_REPORT == true }
            }
            steps {
                script {
                    echo "Publishing HTML report..."
                }
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: 'report*.html',
                    reportName: 'K6 Performance Test Report',
                    reportTitles: 'K6 Load Test Results'
                ])
            }
        }
    }
    
    post {
        success {
            echo "✓ Performance tests completed successfully!"
            echo "Test reports are available in the build artifacts."
        }
        failure {
            echo "✗ Performance tests failed!"
            echo "Check the console output and reports for details."
        }
        always {
            echo "Cleaning up workspace..."
            cleanWs(
                deleteDirs: false,
                patterns: [
                    [pattern: 'report_*.html', type: 'INCLUDE']
                ]
            )
        }
    }
}
