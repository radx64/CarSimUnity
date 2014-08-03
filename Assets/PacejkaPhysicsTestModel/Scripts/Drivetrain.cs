using UnityEngine;
using System.Collections;

public class Drivetrain : MonoBehaviour {
	
	// All the wheels the drivetrain should power
	public Wheel[] poweredWheels;
	
	// The gear ratios, including neutral (0) and reverse (negative) gears
	public float[] gearRatios;
	
	// The final drive ratio, which is multiplied to each gear ratio
	public float finalDriveRatio = 3.23f;
	
	// The engine's torque curve characteristics. Since actual curves are often hard to come by,
	// we approximate the torque curve from these values instead.

	// powerband RPM range
	public float minRPM = 800;
	public float maxRPM = 6400;

	// engine's maximal torque (in Nm) and RPM.
	public float maxTorque = 664;
	public float torqueRPM = 4000;

	// engine's maximal power (in Watts) and RPM.
	public float maxPower = 317000;
	public float powerRPM = 5000;

	// engine inertia (how fast the engine spins up), in kg * m^2
	public float engineInertia = 0.3f;
	
	// engine's friction coefficients - these cause the engine to slow down, and cause engine braking.

	// constant friction coefficient
	public float engineBaseFriction = 25f;
	// linear friction coefficient (higher friction when engine spins higher)
	public float engineRPMFriction = 0.02f;

	// Engine orientation (typically either Vector3.forward or Vector3.right). 
	// This determines how the car body moves as the engine revs up.	
	public Vector3 engineOrientation = Vector3.forward;
	
	// Coefficient determining how muchg torque is transfered between the wheels when they move at 
	// different speeds, to simulate differential locking.
	public float differentialLockCoefficient = 0;
	
	// inputs
	// engine throttle
	public float throttle = 0;
	// engine throttle without traction control (used for automatic gear shifting)
	public float throttleInput = 0;
	
	// shift gears automatically?
	public bool automatic = true;

	// state
	public int gear = 2;
	public float rpm;
	public float slipRatio = 0.0f;
	float engineAngularVelo;
	
	
	float Sqr (float x) { return x*x; }
	
	// Calculate engine torque for current rpm and throttle values.
	float CalcEngineTorque () 
	{
		float result;
		if(rpm < torqueRPM)
			result = maxTorque*(-Sqr(rpm / torqueRPM - 1) + 1);
		else {
			float maxPowerTorque = maxPower/(powerRPM*2*Mathf.PI/60);
			float aproxFactor = (maxTorque-maxPowerTorque)/(2*torqueRPM*powerRPM-Sqr(powerRPM)-Sqr(torqueRPM));
			float torque = aproxFactor * Sqr(rpm-torqueRPM)+maxTorque;
			result=torque>0?torque:0;
		} 
		if(rpm > maxRPM)
		{
			result *= 1-((rpm-maxRPM) * 0.006f);
			if(result<0)
				result=0;
		}
		if(rpm<0)
			result=0;
		return result;
	}
	
	void FixedUpdate () 
	{
		float ratio = gearRatios[gear] * finalDriveRatio;
		float inertia = engineInertia * Sqr(ratio);
		float engineFrictionTorque = engineBaseFriction + rpm * engineRPMFriction;
		float engineTorque = (CalcEngineTorque() + Mathf.Abs(engineFrictionTorque)) * throttle;
		slipRatio = 0.0f;		
		
		if (ratio == 0)
		{
			// Neutral gear - just rev up engine
			float engineAngularAcceleration = (engineTorque-engineFrictionTorque) / engineInertia;
			engineAngularVelo += engineAngularAcceleration * Time.deltaTime;
			
			// Apply torque to car body
			rigidbody.AddTorque(-engineOrientation * engineTorque);
		}
		else
		{
			float drivetrainFraction = 1.0f/poweredWheels.Length;
			float averageAngularVelo = 0;	
			foreach(Wheel w in poweredWheels)
				averageAngularVelo += w.angularVelocity * drivetrainFraction;

			// Apply torque to wheels
			foreach(Wheel w in poweredWheels)
			{
				float lockingTorque = (averageAngularVelo - w.angularVelocity) * differentialLockCoefficient;
				w.drivetrainInertia = inertia * drivetrainFraction;
				w.driveFrictionTorque = engineFrictionTorque * Mathf.Abs(ratio) * drivetrainFraction;
				w.driveTorque = engineTorque * ratio * drivetrainFraction + lockingTorque;

				slipRatio += w.slipRatio * drivetrainFraction;
			}
			
			// update engine angular velo
			engineAngularVelo = averageAngularVelo * ratio;
		}
		
		// update state
		slipRatio *= Mathf.Sign ( ratio );
		rpm = engineAngularVelo * (60.0f/(2*Mathf.PI));
		
		// very simple simulation of clutch - just pretend we are at a higher rpm.
		float minClutchRPM = minRPM;
		if (gear == 2)
			minClutchRPM += throttle * 3000;
		if (rpm < minClutchRPM)
			rpm = minClutchRPM;
			
		// Automatic gear shifting. Bases shift points on throttle input and rpm.
		if (automatic)
		{
			if (rpm >= maxRPM * (0.5f + 0.5f * throttleInput))
				ShiftUp ();
			else if (rpm <= maxRPM * (0.25f + 0.4f * throttleInput) && gear > 2)
				ShiftDown ();
			if (throttleInput < 0 && rpm <= minRPM)
				gear = (gear == 0?2:0);
		}
	}
		
	public void ShiftUp () {
		if (gear < gearRatios.Length - 1)
			gear ++;
	}

	public void ShiftDown () {
		if (gear > 0)
			gear --;
	}

    public float CalculateTorqueGraph(float actualRPM)
    {
        float maxPowerTorque = maxPower / (powerRPM * 2 * Mathf.PI / 60);
        float aproxFactor = (maxTorque - maxPowerTorque) / (2 * torqueRPM * powerRPM - Sqr(powerRPM) - Sqr(torqueRPM));
        float torque = aproxFactor * Sqr(actualRPM - torqueRPM) + maxTorque;
        return torque;
    }

	void OnGUI () {
		GUI.Box(new Rect(0,0,200,100),"Drivetrain");
		GUI.Label(new Rect(0,20,200,100),"RPM: "+rpm);
        string gearLabel;
        if (gear == 0)
        {
            gearLabel = "R";
        }
        else if (gear == 1)
        {
            gearLabel = "N";
        }
        else
        {
            gearLabel = (gear - 1).ToString();
        }

		GUI.Label(new Rect(0,40,200,100),"Gear: "+gearLabel);
		automatic = GUI.Toggle(new Rect(0,60,200,100),automatic, "Automatic Transmission");

        GUI.Box(new Rect(400,0,200,100), "Engine torque");

        /* The "GUIHelper.BeginGroup(Rect)" method can be used now instead of GUI.BeginGroup(Rect) */
        GUIHelper.BeginGroup(new Rect(400, 0, 200, 500));

        /* The "GUIHelper.DrawLine(Vector2, Vector2, Color);"
        method will draw a 2D line, with a specified color */


        Vector2 lastPoint = new Vector2(0, 0);

        for(int i=0; i<18; ++i)
        {
            
            GUIHelper.DrawLine(new Vector2(i*10,0), new Vector2(i*10,100), Color.grey);
            
            float torq = CalculateTorqueGraph(i * 500) / 10.0f;
           
            Vector2 currentPoint = new Vector2(i * 10, 50 - torq/5.0f);
            if (lastPoint == new Vector2(0, 0))
            {
                lastPoint = currentPoint;  
            }
            GUIHelper.DrawLine(lastPoint, currentPoint, Color.green);

            lastPoint = currentPoint;
        }
        GUIHelper.DrawLine(new Vector2(rpm / 50, 0), new Vector2(rpm / 50, 100), Color.red);
        /* The "GUIHelper.EndGroup()" method will pop the clipping, and disable it. Must be called for every "GUIHelper.BeginGroup(Rect);" */
        GUIHelper.EndGroup();
	}
}
