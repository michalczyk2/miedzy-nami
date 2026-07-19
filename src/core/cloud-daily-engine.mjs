export function normalizeInviteCode(value=''){
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
}

export function isValidInviteCode(value=''){
  return /^[A-Z0-9]{6}$/.test(normalizeInviteCode(value));
}

export function compatibilityForQuestion(question,left,right){
  const a=Number(left);const b=Number(right);
  if(!Number.isInteger(a)||!Number.isInteger(b))return 0;
  if(a===b)return 100;
  if(question?.kind==='scale')return Math.max(0,100-Math.abs(a-b)*34);
  if(question?.kind==='groups'){
    const groups=Array.isArray(question.groups)?question.groups:[];
    return groups[a]!==undefined&&groups[a]===groups[b]?60:0;
  }
  return 0;
}

export function buildCloudDailyResult({questions,leftSubmission,rightSubmission}){
  if(!Array.isArray(questions)||questions.length!==5)throw new Error('DAILY_QUESTIONS_INVALID');
  const left=leftSubmission?.answers;const right=rightSubmission?.answers;
  if(!Array.isArray(left)||!Array.isArray(right)||left.length!==5||right.length!==5)throw new Error('DAILY_ANSWERS_INCOMPLETE');
  const details=questions.map((question,index)=>({
    questionId:question.id,
    leftAnswer:Number(left[index]),
    rightAnswer:Number(right[index]),
    compatibility:compatibilityForQuestion(question,left[index],right[index]),
  }));
  const score=Math.round(details.reduce((sum,item)=>sum+item.compatibility,0)/details.length);
  return{score,details};
}

export function chooseSubmissionsForMembers(submissions,members){
  const byUser=new Map((submissions||[]).map(item=>[item.user_id,item]));
  const ordered=[...(members||[])].sort((a,b)=>Number(a.role_index)-Number(b.role_index));
  return ordered.map(member=>byUser.get(member.user_id)||null);
}

export function cloudDailyStatus({ownSubmission,partnerSubmission,result}){
  if(result)return'result';
  if(ownSubmission&&partnerSubmission)return'finalizing';
  if(ownSubmission)return'waiting';
  return'answering';
}
