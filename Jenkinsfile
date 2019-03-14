pipeline {
  agent {
    docker {
      image 'node'
      args '-v /home/sn0wcat/mc:/.mc -v /home/sn0wcat/jenkins_artefacts/node-red-contrib-mindconnect:/publish'
    }
  }
stages {
      stage('Prepare') {
      steps {
        sh '''
        pwd
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
        sh 'npm test'
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
      }
    }
  }
  
  environment {
    CI = 'true'
  }
}