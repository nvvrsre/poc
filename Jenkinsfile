pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    REPORT_FILE = ""
    FINAL_REPORT = ""
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify k6') {
      steps {
        sh 'k6 version'
      }
    }

    stage('Run k6 Test') {
      steps {
        sh '''
          set -e
          echo "Running k6 load test..."
          k6 run script.js
        '''
      }
    }

    stage('Collect Report') {
      steps {
        script {
          def reportFile = sh(
            script: "ls -1 report_*.html 2>/dev/null | sort | tail -n 1 || true",
            returnStdout: true
          ).trim()

          if (!reportFile) {
            error "No HTML report found"
          }

          env.REPORT_FILE = reportFile
          env.FINAL_REPORT = "k6_report_build_${env.BUILD_NUMBER}.html"

          sh """
            mv ${env.REPORT_FILE} ${env.FINAL_REPORT}
          """

          echo "Final report: ${env.FINAL_REPORT}"
          archiveArtifacts artifacts: env.FINAL_REPORT, fingerprint: true
        }
      }
    }
  }

  post {

    success {
      script {
        def reportLink = "${env.BUILD_URL}artifact/${env.FINAL_REPORT}"

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Report:
${reportLink}

(Open in browser for full colors & charts)
"""
        )
      }
    }

    failure {
      slackSend(
        channel: "#all-poc-k6",
        message: """❌ *k6 POC FAILED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Logs: ${env.BUILD_URL}
"""
      )
    }
  }
}
