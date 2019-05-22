pipeline {
  agent {
    docker {
      image 'node'
      args '-v /home/sn0wcat/noderedmc:/.mc -v /home/sn0wcat/jenkins_artefacts/node-red-contrib-mindconnect:/publish'
    }
  }
stages {
      stage('Prepare') {
      steps {
        sh '''
        pwd
        mkdir .mc
        cp -a /.mc/. .mc/
        cp .mc/1bfab1f65e9b4fb4a8c6af30a7e2ed1f.json agentconfig.json
        '''
      }
    }

    stage('Build') {
      steps {
        sh 'npm install'
      }
    }
    stage('Test') {
      steps {
        sh 'npm run test-jenkins'
      }
    }
    stage('License') {
      steps {
        sh 'npm run license > license-checker.txt'
        sh 'npm run license:summary >> license-checker.txt'
      }
    }
    stage('Package') {
      steps {
        sh '''
        npm pack --unsafe-perm
        '''
      }
    }
    stage('Archive Artifacts') {
      steps {
        archiveArtifacts '*.tgz'
        archiveArtifacts 'license-checker.txt'
      }
    }
  }
  
  environment {
    CI = 'true'
  }
   post {
    always {
      sh '''
          cp -rf .mc/*.json /.mc/
          '''
      junit '**/*.xml'

    }
   }
}