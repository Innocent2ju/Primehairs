'use client'

const TestBtn = () => {
    return (
        <button 
  onClick={() => { 
    throw new Error("Hello PostHog, testing error tracking!"); 
  }}
  style={{ background: 'red', color: 'white', padding: '10px 20px', margin: '20px' }}
>
  Trigger Test Error
</button>
    )
}
export default TestBtn